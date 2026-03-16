import { EVENT_TIK_ACTION_PROP, eventProgress } from '../core/constants';
import createPool from '../core/db_connection';
import axios from 'axios';
import dotenv from 'dotenv';
import { dd } from '../utils/dd';
import { parseServerResponse } from '../utils/parseServerResponse';
import { buildOuterEntityId } from '../utils/buildOuterEntityId';
import { thisProjectResProp, tikResProp } from '../utils/getResProp';
import { ConfigManager } from './config-manager';
import { OuterSyncService } from './outer-sync.service';
import { upsertEventState } from '../db-actions/upsert-event-state';
import { addEventStateHistory } from '../db-actions/add-event-state-history';
import { ACCESS_CASE, getAccessibleEvent } from '../db-actions/get-accessible-event';
import { createEvent, DbActionResult } from '../db-actions/create-event';
import { upsertEventAccess } from '../db-actions/upsert-event-access';
import { getRecentEvent } from '../db-actions/get-recent-event';
import { getScheduleWithEvents } from '../db-actions/get-schedules-with-events'
import { EventStateResItem, EventStatus, MinimalEventProps } from '../types/event-state.types';
import { EventPropsDbItem, toMinProps } from '../types/event.types';
import { ControllerResult } from '../types/controller.types';
import { EventWithStateDTO, GetRecentEventOrScheduleRes } from '../types/event-state.api.types';
import { getEventStateHooks } from '../db-actions/get-event-state-hooks';
import { createEventStateHooks } from '../db-actions/create-event-state-hooks';
import { buildTikEvents } from './helpers/build-tik-events';
import { calculateEventStatus } from './helpers/calculate-event-status.ts';

dotenv.config();

export class EventStateController {
    /**
     * Create or update event state and add history entry
     */
    static async createOrUpdateEventState(
        userHandler: any, 
        eventId: any, 
        state: any,
    ): Promise<any> {
        const pool = createPool();
        const connection = await pool.getConnection();
        let getAccessibleEventResult,
            upsertStateResult,
            addEventStateHistoryResult,
            tikResponse;
        try {
            await connection.beginTransaction();

            getAccessibleEventResult = await getAccessibleEvent(connection, eventId, userHandler, ACCESS_CASE.UPDATE);
            if (!getAccessibleEventResult.success) {
                throw new Error(getAccessibleEventResult.error!);
            }

            upsertStateResult = await upsertEventState(connection, eventId, state) // todo add false return if no updated
            
            if (!upsertStateResult.isStateUpdated) {
                await connection.commit();
                return {
                    eventId,
                    state,
                    userHandler,
                    created: false,
                    updated: false,
                    stateChanged: false
                };
            }
           
            addEventStateHistoryResult = await addEventStateHistory(connection, eventId, state)

            const eventProps: EventPropsDbItem = getAccessibleEventResult.result[0];
           
            const updatedEventsWithStatus: EventStateResItem[] = await buildTikEvents(connection, toMinProps(eventProps));
            await connection.commit();

            const tikAction = 'update';
            const updatedEventStatusWithTikAction = OuterSyncService.addOuterActionInEvents(updatedEventsWithStatus, tikAction);
            const tikUpdateEntryPayload = {
                poolId: 'current_user_id',
                data: updatedEventStatusWithTikAction,
                projectId: 'doro@web',
            }
            tikResponse = await axios.post(`${process.env['TIK_BACK_URL']}/updateEventsState`,
                // {
                //     poolId: 'current_user_id',
                //     data: updatedEventStatusWithTikAction,
                //     projectId: 'doro@web',

                //     // requesterProject,
                //     // requesterApiKey: apiKeyHeader,
                //     // requesterUrl
                // }
                tikUpdateEntryPayload
                // ,
                //  {
                //   headers: {
                //     'X-Project-Id': process.env.PROJECT_ID,
                //     'X-Project-Domain-Name': `${req.protocol}://${req.get('host')}`,
                //     'X-Api-Key': process.env.BASE_KEY
                //   }
                // }
            );
            return {
                data: {
                    success: true,
                    
                    updatedEvents: [{
                        id: eventProps.id,
                        name: eventProps.name,
                        length: eventProps.length,
                        access_level: (eventProps as any)?.access_level ?? 'wrong prop name'
                    }],
                },
                debug: {
                    [thisProjectResProp()]: {
                        getAccessibleEventResult,
                        upsertStateResult,
                        addEventStateHistoryResult,
                    },
                    [tikResProp()]: {
                        request: tikUpdateEntryPayload,
                        response: parseServerResponse(tikResponse),
                    }
                }
            };

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Get events with current status and elapsed seconds
     */
    static async getEventsWithStatus(userHandler: any) {
        dd('getEventsWithStatus')
        const pool = createPool();
        const connection = await pool.getConnection();
        try {
            const [events] = await connection.execute(
                `SELECT 
                        e.id,
                        e.name,
                        e.length,
                        e.type as event_type,
                        es.event_state_id as current_state,
                        es.updated_at as last_state_change,
                        e.created_at,
                        etu.access_level
                     FROM events e
                     INNER JOIN eventToUser etu ON e.id = etu.event_id
                     LEFT JOIN eventState es ON e.id = es.eventId
                     WHERE etu.user_handler = ? AND e.created_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 1 DAY)
                     ORDER BY e.created_at DESC`,
                [userHandler]            
            );

            // Process each event to determine status and current seconds
            const eventsWithStatus = await buildTikEvents(connection, events);

            const eventsWithTikAction = OuterSyncService.addOuterActionInEvents(eventsWithStatus, 'add');

            const configHashEntry = { 
                id: buildOuterEntityId('configHash', 1), // 1 - id
                cur: ConfigManager.configHash,
                [EVENT_TIK_ACTION_PROP]: 'upsert',
            };

            const productEntriesForTik: any[] = [...eventsWithTikAction, configHashEntry];

            console.log(productEntriesForTik)
            // return productEntriesForTik;
            return { 
                data: productEntriesForTik,
                debug: {
                    events: JSON.stringify(events[0]),
                    eventsWithStatus: JSON.stringify(eventsWithStatus[0]),
                    eventsWithTikAction,
                    productEntriesForTik,
                }
            }
        } catch (error) {
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * play event if it is not completed (states: 'STOPPED': 0,'PAUSED': 2)
     * if completed ('COMPLETED': 3) - duplicate event, then createOrUpdateEventState(1)
     * */
    static async playOrDuplicateEvent(userHandler: any, eventId: any) {
        
        const state = eventProgress.PLAYING; // 1
        const pool = createPool();
        const connection = await pool.getConnection();
        let getAccessibleEventResult,
            calculateEventStatusResult,
            createdEventId,
            upsertStateResult,
            addHistoryResult,
            getEventStateHooksResult,
            createEventStateHookResult,
            upsertEventAccessResult;
        try {
            await connection.beginTransaction();

            getAccessibleEventResult = await getAccessibleEvent(connection, eventId, userHandler, 1);
            if (!getAccessibleEventResult.success) {
                throw new Error(getAccessibleEventResult.error!);
            }

            const eventProps: EventPropsDbItem = getAccessibleEventResult.result[0];
            calculateEventStatusResult = await calculateEventStatus(connection, toMinProps(eventProps));
            if (!calculateEventStatusResult.success) {
                throw new Error(calculateEventStatusResult.error!);
            }

            const eventStatus: EventStatus = calculateEventStatusResult.result!
          
            dd(eventStatus);
            if (eventStatus.status === eventProgress.STOPPED || eventStatus.status === eventProgress.PAUSED) {
                dd('CHANGING STATE (PLAYING) OF EXISTING EVENT')
                
                upsertStateResult = await upsertEventState(connection, eventId, state)
                addHistoryResult = await addEventStateHistory(connection, eventId, state)

            } else if (eventStatus.status === eventProgress.COMPLETED) {
                dd('DUPLICATING EVENT')
                const name = eventProps.name;
                const length = eventProps.length;
                const type = Number(eventProps.type);
                const accessLevel = 'owner';
                // todo add hooks?

                const createEventResult = await createEvent(connection, name, length, type, userHandler);
                if (createEventResult.error) {
                    throw new Error(createEventResult.error);
                }
                createdEventId = createEventResult.result;
                getEventStateHooksResult = await getEventStateHooks(connection, eventId);
                createEventStateHookResult = await createEventStateHooks(connection, eventId, getEventStateHooksResult.hooks);
                upsertEventAccessResult = await upsertEventAccess(connection, createdEventId, userHandler, accessLevel)
                upsertStateResult = await upsertEventState(connection, createdEventId, state)
                addHistoryResult = await addEventStateHistory(connection, createdEventId, state)
                //no need history on create
            } else {
                throw new Error('wrong state of event')
            }
            
            // eventProgress.COMPLETED - add event copy
            const eventPropsForCalc = { 
                id: eventStatus.status === eventProgress.COMPLETED ? createdEventId : eventId, 
                length: eventProps.length,
                event_type: eventProps.type,
            }
            // dd(eventPropsForCalc)
            // dd(eventProgress.COMPLETED)
            // dd(eventProgress.COMPLETED ? createdEventId : eventId)
            // dd(createdEventId)
            // dd(eventId)
            // build event for tik
            const updatedEventsStatus: EventStateResItem[] = await buildTikEvents(connection, eventPropsForCalc);
            await connection.commit();
            // dd(updatedEventsStatus)
            const tikAction = eventProgress.COMPLETED ? 'add' : 'update';
            const updatedEventStatusWithTikAction = OuterSyncService.addOuterActionInEvents(updatedEventsStatus, tikAction);
            // dd(updatedEventStatusWithTikAction)
            // request to tik@back
            let tikResponse;
            tikResponse = await axios.post(`${process.env['TIK_BACK_URL']}/updateEventsState`,
                {
                    poolId: 'current_user_id',
                    data: updatedEventStatusWithTikAction,
                    projectId: 'doro@web',

                    // requesterProject,
                    // requesterApiKey: apiKeyHeader,
                    // requesterUrl
                }
                // ,
                //  {
                //   headers: {
                //     'X-Project-Id': process.env.PROJECT_ID,
                //     'X-Project-Domain-Name': `${req.protocol}://${req.get('host')}`,
                //     'X-Api-Key': process.env.BASE_KEY
                //   }
                // }
            );
            
            return {
                data: {
                    success: true,
                    isDuplicate: eventStatus.status === eventProgress.COMPLETED,
                    actualEventId: eventProgress.COMPLETED ? createdEventId : eventId, //eventS!
                    addedEvents: [{
                        id: createdEventId,
                        name: eventProps.name,
                        length: eventProps.length,
                        access_level: "owner",
                    }],
                },
                debug: {
                    [thisProjectResProp()]: {
                        getAccessibleEventResult,
                        calculateEventStatusResult,
                        isDuplicate: eventStatus.status === eventProgress.COMPLETED,
                        actualEventId: eventProgress.COMPLETED ? createdEventId : eventId, //eventS!
                        addedEvents: [{
                            id: createdEventId,
                            name: eventProps.name,
                            length: eventProps.length,
                            access_level: "owner",
                        }],
                        upsertStateResult,
                        addHistoryResult,
                        upsertEventAccessResult,
                    },
                    [tikResProp()]: parseServerResponse(tikResponse)
                }
            };
        } catch (error: any) { 
            console.log(error)
            await connection.rollback();
            throw new Error('playOrDuplicateEvent error: ' + (error?.message ?? error));
        } finally {
            connection.release();
        }
    }

    static async getRecentEventOrSchedule(
        userHandler
    ): Promise<ControllerResult<GetRecentEventOrScheduleRes>> {
        
        const pool = createPool();
        const connection = await pool.getConnection();

        let getRecentEventResult,
            calculateEventStatusResult,
            getEventStateHooksResult,
            getSchduleWithEventsResult;

        try {
            getRecentEventResult = await getRecentEvent(connection, userHandler);
            
            if (getRecentEventResult.error) {
                throw new Error('getRecentEventResult.error: ' + getRecentEventResult.error);
            }
            if (getRecentEventResult.result.length === 0) {
                throw new Error('NO RECENT ITEMS');
            }
            const recentEvent: EventPropsDbItem = getRecentEventResult.result?.[0];
            
            calculateEventStatusResult = await calculateEventStatus(connection, toMinProps(recentEvent));
            if (!calculateEventStatusResult.success) {
                throw new Error(calculateEventStatusResult.error!);
            }

            const eventStatus: EventStatus = calculateEventStatusResult.result!

            getEventStateHooksResult = await getEventStateHooks(connection, { eventId: recentEvent.id });

            const eventWithState: EventWithStateDTO = { 
                ...recentEvent, 
                eventState: eventStatus,
                eventStateHooks: getEventStateHooksResult.success ? getEventStateHooksResult.hooks : [],
            }
            
            if (recentEvent.schedule_id) {
                getSchduleWithEventsResult = await getScheduleWithEvents(connection, userHandler, recentEvent.schedule_id);
                
                const eventsWithState = await Promise.all(
                    getSchduleWithEventsResult.result.events.map(async eachEvent => {
                        const eachEventMinimalProps: MinimalEventProps = { id: eachEvent.id, length: eachEvent.length, event_type: eachEvent.event_type };
                        const { result: eachEventStatus } = await calculateEventStatus(connection, eachEventMinimalProps);
                        const getEachEventStateHooksResult = await getEventStateHooks(connection, { eventId: eachEvent.id });
                        const eachEventWithState: EventWithStateDTO = { 
                            ...eachEvent, 
                            eventState: eachEventStatus,
                            eventStateHooks: getEachEventStateHooksResult.success ? getEachEventStateHooksResult.hooks : []
                        };
                        return eachEventWithState;
                    })
                );
        
                getSchduleWithEventsResult.result.events = eventsWithState;
            }

            
            return {
                data: {
                    recentEvent: eventWithState,
                    recentSchedule: getSchduleWithEventsResult?.result,
                },
                debug: {
                    [thisProjectResProp()]: {
                        getRecentEventResult,
                        calculateEventStatusResult,
                        getEventStateHooksResult,
                        getSchduleWithEventsResult
                    },
                }
            }
        } catch (e: any) {
            return {
                data: {
                    recentEvent: null,
                    recentSchedule: null,
                },
                debug: {
                    [thisProjectResProp()]: {
                        getRecentEventResult,
                        calculateEventStatusResult,
                        getEventStateHooksResult,
                        getSchduleWithEventsResult
                    }
                },
                error: e.message
            };
        }
    } 
}