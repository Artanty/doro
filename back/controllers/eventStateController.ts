import { EVENT_TIK_ACTION_PROP, eventProgress } from '../core/constants';
import createPool from '../core/db_connection';
import axios from 'axios';
import dotenv from 'dotenv';
import { EventController } from './eventController';
import { dd } from '../utils/dd';
import { ensureArray } from '../utils/ensureArray';
import { parseServerResponse } from '../utils/parseServerResponse';
import { buildOuterEntityId } from '../utils/buildOuterEntityId';
import { thisProjectResProp, tikResProp } from '../utils/getResProp';
import { getUTCDatetime } from '../utils/get-utc-datetime';
import { ConfigManager } from './config-manager';
import { OuterSyncService } from './outer-sync.service';
import { upsertEventState } from '../db-actions/upsert-event-state';
import { addEventStateHistory } from '../db-actions/add-event-state-history';
import { ACCESS_CASE, getAccessibleEvent } from '../db-actions/get-accessible-event';
import { createEvent, DbActionResult } from '../db-actions/create-event';
import { upsertEventAccess } from '../db-actions/upsert-event-access';
import { getRecentEvent } from '../db-actions/get-recent-event';
import { getScheduleWithEvents } from '../db-actions/get-schedules-with-events';
import { getEventState } from '../db-actions/get-event-state';
import { EventPropsPure, EventStateResItem, EventStatus, MinimalEventProps } from '../types/event-state.types';
import { getEventStateHistory } from '../db-actions/get-event-state-history';
import { EventPropsDbItem } from '../types/event.types';
import { ControllerResult } from '../types/controller.types';
import { EventWithStateDTO, GetRecentEventOrScheduleRes } from '../types/event-state.api.types';

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

            const eventProps: EventPropsPure = getAccessibleEventResult.result[0];
           
            const updatedEventsWithStatus: EventStateResItem[] = await this.buildTikEvents(connection, eventProps);
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
                        et.name as event_type,
                        es.event_state_id as current_state,
                        es.updated_at as last_state_change,
                        etu.access_level
                     FROM events e
                     INNER JOIN eventToUser etu ON e.id = etu.event_id
                     INNER JOIN eventTypes et ON e.type = et.id
                     LEFT JOIN eventState es ON e.id = es.eventId
                     WHERE etu.user_handler = ?
                     ORDER BY e.created_at DESC`,
                [userHandler]            
            );

            // Process each event to determine status and current seconds
            const eventsWithStatus = await this.buildTikEvents(connection, events);

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
        let eventWithAccessResult;
        const state = eventProgress.PLAYING; // 1
        const pool = createPool();
        const connection = await pool.getConnection();
        let createdEventId,
            upsertStateResult,
            addHistoryResult,
            upsertEventAccessResult;
        try {
            await connection.beginTransaction();

            eventWithAccessResult = await getAccessibleEvent(connection, eventId, userHandler, 1);
            if (!eventWithAccessResult.success) {
                throw new Error(eventWithAccessResult.error!);
            }

            const eventProps: EventPropsPure = eventWithAccessResult.result[0];
            // : EventStatus
            const { eventStatus } = await this.calculateEventStatus(connection, eventProps);
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

                const createEventResult = await createEvent(connection, name, length, type, userHandler);
                if (createEventResult.error) {
                    throw new Error(createEventResult.error);
                }
                createdEventId = createEventResult.result;

                upsertEventAccessResult = await upsertEventAccess(connection, createdEventId, userHandler, accessLevel)
                upsertStateResult = await upsertEventState(connection, createdEventId, state)
                addHistoryResult = await addEventStateHistory(connection, createdEventId, state)
            } else {
                throw new Error('wrong state of event')
            }
            
            // eventProgress.COMPLETED - add event copy
            const eventPropsForCalc = { 
                id: eventStatus.status === eventProgress.COMPLETED ? createdEventId : eventId, 
                length: eventProps.length 
            }
            // dd(eventPropsForCalc)
            // dd(eventProgress.COMPLETED)
            // dd(eventProgress.COMPLETED ? createdEventId : eventId)
            // dd(createdEventId)
            // dd(eventId)
            // build event for tik
            const updatedEventsStatus: EventStateResItem[] = await EventStateController.buildTikEvents(connection, eventPropsForCalc);
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
                        eventWithAccessResult,

                        success: true,
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

        let getRecentEventResult: DbActionResult<EventPropsDbItem>;
        let getSchduleWithEventsResult;

        getRecentEventResult = await getRecentEvent(connection, userHandler);

        if (getRecentEventResult.error) {
            throw new Error('getRecentEventResult.error: ' + getRecentEventResult.error);
        }
        const recentEvent = getRecentEventResult.result!;

        const minimalEventProps: MinimalEventProps = { id: recentEvent.id, length: recentEvent.length }
        
        const { eventStatus } = await this.calculateEventStatus(connection, minimalEventProps);

        const eventWithState: EventWithStateDTO = { ...recentEvent, eventState: eventStatus }
        
        if (recentEvent.schedule_id) {
            getSchduleWithEventsResult = await getScheduleWithEvents(connection, userHandler, recentEvent.schedule_id);
            
            const eventsWithState = await Promise.all(
                getSchduleWithEventsResult.result.events.map(async eachEvent => {
                    const eachEventMinimalProps: MinimalEventProps = { id: eachEvent.id, length: eachEvent.length };
                    const { eventStatus: eachEventStatus } = await this.calculateEventStatus(connection, eachEventMinimalProps);
                    const eachEventWithState: EventWithStateDTO = { ...eachEvent, eventState: eachEventStatus };
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
                    getRecentEventResult, //todo add state result
                    getSchduleWithEventsResult //todo add state result ?
                },
            }
        }
    }
    /**
     * Calculate event status and current seconds based on state and history
     */
    static async calculateEventStatus(
        connection, event: MinimalEventProps
    ): Promise<{ eventStatus: EventStatus, debug: any }> {
        const debug = {};
        const eventId = event.id;
        const eventLengthSeconds = event.length;
        let currentStateResult: DbActionResult<number>;
        
        currentStateResult = await getEventState(connection, event);

        if (!currentStateResult.success) {
            throw new Error(currentStateResult.error ?? 'undefined error, check wtf')
        }

        const currentState = currentStateResult.result;

        if (currentState === eventProgress.STOPPED) {
            return {
                eventStatus: {
                    status: eventProgress.STOPPED,
                    currentSeconds: 0,    
                },
                debug: {
                    currentStateResult
                }  
            };
        } else if (currentState === eventProgress.COMPLETED) {
            return {
                eventStatus: {
                    status: eventProgress.COMPLETED,
                    currentSeconds: 0,
                }, 
                debug
            };
        }
         
        const historyResult = await getEventStateHistory(connection, eventId);
        
        if (!historyResult.success) {
            throw new Error(historyResult.error ?? 'history undefined error, check wtf')
        }

        const history = historyResult.result!;

        let totalActiveSeconds = 0;
        let activeStartTime: Date | null = null;
        
        // Calculate total active time from history
        for (const record of history) {
            if (record.event_state_id === eventProgress.PLAYING && activeStartTime === null) {
                // Start of active period - create UTC date
                activeStartTime = new Date(record.created_at + 'Z');
            } else if (
                (record.event_state_id === eventProgress.STOPPED || 
                    record.event_state_id === eventProgress.PAUSED) && 
                activeStartTime !== null
            ) {
                // End of active period - calculate duration with UTC date
                const activeEndTime = new Date(record.created_at + 'Z');
                const diff = activeEndTime.getTime() - activeStartTime.getTime();
                const durationSeconds = Math.floor(diff / 1000);
                totalActiveSeconds += durationSeconds;
                activeStartTime = null;
            }
        }
        
        // If currently active and we have an open active period
        if (currentState === eventProgress.PLAYING && activeStartTime !== null) {
            const currentTime = new Date();
            // Get current time in UTC
            const currentUTC = Date.UTC(
                currentTime.getUTCFullYear(),
                currentTime.getUTCMonth(),
                currentTime.getUTCDate(),
                currentTime.getUTCHours(),
                currentTime.getUTCMinutes(),
                currentTime.getUTCSeconds(),
                currentTime.getUTCMilliseconds()
            );
            const diff = currentUTC - activeStartTime.getTime();
            const currentActiveSeconds = Math.floor(diff / 1000);
            totalActiveSeconds += currentActiveSeconds;
        }

        // Cap at event length
        const currentSeconds = Math.min(totalActiveSeconds, eventLengthSeconds);

        if (currentState === eventProgress.PLAYING) {
            return {
                eventStatus: {
                    status: currentSeconds >= eventLengthSeconds ? eventProgress.COMPLETED : eventProgress.PLAYING,
                    currentSeconds: currentSeconds,
                }, debug
            };
        } else if (currentState === eventProgress.PAUSED) {
            return {
                eventStatus: {
                    status: eventProgress.PAUSED,
                    currentSeconds: currentSeconds,
                }, debug
            };
        }

        return {
            eventStatus: {
                status: eventProgress.STOPPED,
                currentSeconds: 0,
            }, debug
        };
    }

    /**
     * Get user's eventStates with sorting (active first, then paused, then last changed)
     */
    static async getUserEventStates(userHandler: any, limit = 50) {
        console.log(userHandler)
        const pool = createPool();
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.execute(
                `SELECT 
                    es.*, 
                    e.name as event_name, 
                    e.length, 
                    e.type,
                    et.name as event_type_name,
                    etu.access_level
                 FROM eventState es 
                 INNER JOIN events e ON es.eventId = e.id 
                 INNER JOIN eventToUser etu ON e.id = etu.event_id
                 INNER JOIN eventTypes et ON e.type = et.id
                 WHERE etu.user_handler = ? 
                 ORDER BY 
                     CASE 
                         WHEN es.event_state_id = 1 THEN 1  -- Active first
                         WHEN es.event_state_id = 2 THEN 2  -- Paused second
                         ELSE 3                    -- Other states
                     END,
                     es.updated_at DESC
                 LIMIT ?`,
                [userHandler, limit]
            );

            return rows;
        } catch (error) {
            throw error;
        } finally {
            connection.release();
        }
    }


    static async buildTikEvents(connection, events: MinimalEventProps | MinimalEventProps[]): Promise<EventStateResItem[]> {
        events = ensureArray(events);
        dd(events)
        const eventsWithStatus = await Promise.all(
            events.map(async (eventProps: MinimalEventProps) => {
                const { eventStatus } = await this.calculateEventStatus(connection, eventProps);
                const res: EventStateResItem = {
                    id: buildOuterEntityId('event', eventProps.id),
                    cur: eventStatus.currentSeconds,
                    len: eventProps.length,
                    stt: eventStatus.status
                }

                return res;
            })
        );
        dd(eventsWithStatus)
        return eventsWithStatus;
    }
}