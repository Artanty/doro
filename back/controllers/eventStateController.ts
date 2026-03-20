import { EVENT_TIK_ACTION_PROP, eventProgress } from '../core/constants';
import createPool from '../core/db_connection';
import axios from 'axios';
import dotenv from 'dotenv';
import { dd } from '../utils/dd';
import { parseServerResponse } from '../utils/parseServerResponse';
import { buildOuterEntityId } from '../utils/buildOuterEntityId';
import { thisProjectResProp, tikResProp } from '../utils/getResProp';
import { ConfigManager } from './config-manager';
import { OuterSyncService, TikRes } from './outer-sync.service';
import { bulkUpsertEventState, upsertEventState, UpsertEventStateItem } from '../db-actions/upsert-event-state';
import { addEventStateHistory, bulkAddEventStateHistory } from '../db-actions/add-event-state-history';
import { ACCESS_CASE, getAccessibleEvent, getAccessibleEvents } from '../db-actions/get-accessible-event';
import { createEvent, DbActionResult } from '../db-actions/create-event';
import { upsertEventAccess } from '../db-actions/upsert-event-access';
import { EventStateResItem, EventStatus, MinimalEventProps } from '../types/event-state.types';
import { EventPropsDbItem, toMinProps } from '../types/event.types';
import { ControllerResult } from '../types/controller.types';
import { EventWithStateDTO, GetRecentEventOrScheduleRes } from '../types/event-state.api.types';
import { getEventStateHooks } from '../db-actions/get-event-state-hooks';
import { createEventStateHooks } from '../db-actions/create-event-state-hooks';
import { buildTikEvents } from './helpers/build-tik-events';
import { calculateEventStatus } from './helpers/calculate-event-status.ts';
import { formatBulkErrors } from '../utils/format-bulk-errors.utl';
import { buildScheduleInfo } from './event.controller/create-event.ctl';

dotenv.config();

export class EventStateController {
    /**
     * Create or update event state and add history entry
     */
    static async createOrUpdateEventState(
        userHandler: any, 
        eventStates: UpsertEventStateItem[],
        // eventId: any, 
        // state: any,
    ): Promise<any> {
        // debugger;
        const pool = createPool();
        const connection = await pool.getConnection();
        let getAccessibleEventResult,
            upsertStateResult,
            addEventStateHistoryResult,
            tikEntriesPayload,
            tikResponse!: TikRes;
        try {
            await connection.beginTransaction();

            const idsToCheck = eventStates.map(e => e.eventId)
            getAccessibleEventResult = await getAccessibleEvents(connection, idsToCheck, userHandler, ACCESS_CASE.UPDATE);
            if (!getAccessibleEventResult.success) {
                throw new Error(formatBulkErrors(getAccessibleEventResult));
            }

            upsertStateResult = await bulkUpsertEventState(connection, eventStates) // todo add false return if no updated
            
            if (!upsertStateResult.success) {
                throw new Error('state is not updated');
            }
            
            addEventStateHistoryResult = await bulkAddEventStateHistory(connection, eventStates)
            // debugger;
            const eventsArr = Array.from(getAccessibleEventResult.results.values());
            const minProps = eventsArr.map(e => toMinProps(e as EventPropsDbItem));
            // const eventProps: EventPropsDbItem = getAccessibleEventResult.results.get(eventId);
            
            // const minProps = toMinProps(eventProps);
            const updatedEventsWithStatus: EventStateResItem[] = await buildTikEvents(connection, minProps);
            await connection.commit();

            ConfigManager.setConfigHash();
            const hashPayload = OuterSyncService.buildUpdateOuterHashPayload('upsert');
            const eventsPayload = OuterSyncService.addOuterActionInEvents(updatedEventsWithStatus, 'update');
            tikEntriesPayload = [...hashPayload, ...eventsPayload]
            tikResponse = await OuterSyncService.updateOuterEntries(tikEntriesPayload);
            
            return {
                data: {
                    success: true,
                },
                debug: {
                    [thisProjectResProp()]: {
                        getAccessibleEventResult,
                        upsertStateResult,
                        addEventStateHistoryResult,
                    },
                    [tikResProp()]: {
                        request: tikEntriesPayload,
                        response: tikResponse,
                    }
                }
            };

        } catch (error: any) {
            await connection.rollback();
            return {
                data: {
                    success: false,
                    updatedEvents: [],
                },
                debug: {
                    [thisProjectResProp()]: {
                        getAccessibleEventResult,
                        upsertStateResult,
                        addEventStateHistoryResult,
                    },
                    [tikResProp()]: {
                        request: tikEntriesPayload,
                        response: tikResponse,
                    }
                },
                error: error.message
            };
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
        debugger;
        try {
            const [events] = await connection.execute(
                `SELECT 
                    e.id,
                    e.name,
                    e.length,
                    e.type as event_type,
                    e.event_state_id as current_state,
                    e.updated_at as last_state_change,
                    e.created_at,
                    etu.access_level
                 FROM events e
                 INNER JOIN eventToUser etu ON e.id = etu.event_id
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
            upsertEventStateResult,
            addHistoryResult,
            createdEventId,
            getEventStateHooksResult,
            createEventStateHookResult,
            upsertEventAccessResult,
            tikResponse;
        try {
            await connection.beginTransaction();

            getAccessibleEventResult = await getAccessibleEvent(connection, eventId, userHandler, 1);
            if (!getAccessibleEventResult.success) {
                throw new Error(getAccessibleEventResult.error!);
            }

            const eventProps: EventPropsDbItem = getAccessibleEventResult.result;
            calculateEventStatusResult = await calculateEventStatus(connection, toMinProps(eventProps));
            if (!calculateEventStatusResult.success) {
                throw new Error(calculateEventStatusResult.error!);
            }

            const eventStatus: EventStatus = calculateEventStatusResult.result!
          
            dd(eventStatus);
            if (eventStatus.status === eventProgress.STOPPED || eventStatus.status === eventProgress.PAUSED) {
                dd('CHANGING STATE (PLAYING) OF EXISTING EVENT')
                
                upsertEventStateResult = await upsertEventState(connection, eventId, state)
                addHistoryResult = await addEventStateHistory(connection, eventId, state)
                ConfigManager.setConfigHash();
                const hashPayload = OuterSyncService.buildUpdateOuterHashPayload('upsert');
                const eventsPayload = OuterSyncService.buildNewOuterEventPayload(eventId, eventProps.length, state, 'event');
                tikResponse = await OuterSyncService.updateOuterEntries([...hashPayload, ...eventsPayload]);
                await connection.commit();

            } else if (eventStatus.status === eventProgress.COMPLETED) {
                dd('DUPLICATING EVENT')
                const name = eventProps.name;
                const length = eventProps.length;
                const type = Number(eventProps.type);
                const accessLevel = 3;

                const { schedule_id, schedule_position } = await buildScheduleInfo(
                    connection, 
                    eventProps.schedule_id, 
                    eventProps.schedule_position
                );
                const base_access = eventProps.base_access_id
                const created_from = `e_${eventId}`;

                const createEventResult = await createEvent(
                    connection, name, length, type, userHandler,
                    schedule_id, schedule_position,
                    base_access, created_from, state
                );
                if (createEventResult.error) {
                    throw new Error(createEventResult.error);
                }
                createdEventId = createEventResult.result;

                getEventStateHooksResult = await getEventStateHooks(connection, { eventId });

                createEventStateHookResult = await createEventStateHooks(connection, createdEventId, getEventStateHooksResult.hooks);

                upsertEventAccessResult = await upsertEventAccess(connection, createdEventId, userHandler, accessLevel)
                // debugger;
                // upsertEventStateResult = await upsertEventState(connection, createdEventId, state)
                //
                ConfigManager.setConfigHash();
                const hashPayload = OuterSyncService.buildUpdateOuterHashPayload('upsert');
                const eventsPayload = OuterSyncService.buildNewOuterEventPayload(createdEventId, length, state);
                tikResponse = await OuterSyncService.updateOuterEntries([...hashPayload, ...eventsPayload]);
                await connection.commit();
            } else {
                throw new Error('wrong state of event')
            }

            return {
                data: {
                    success: true,
                    isDuplicate: eventStatus.status === eventProgress.COMPLETED,
                    actualEventId: eventProgress.COMPLETED ? createdEventId : eventId, //eventS!
                },
                debug: {
                    [thisProjectResProp()]: {
                        getAccessibleEventResult,
                        calculateEventStatusResult,
                        isDuplicate: eventStatus.status === eventProgress.COMPLETED,
                        actualEventId: eventProgress.COMPLETED ? createdEventId : eventId, //eventS!
                       
                        upsertEventStateResult,
                        addHistoryResult,
                        upsertEventAccessResult,
                        getEventStateHooksResult,
                        createEventStateHookResult,
                    },
                    [tikResProp()]: tikResponse
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
}