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
import { getAccessibleEvent } from '../db-actions/get-accessible-event';
import { createEvent } from '../db-actions/create-event';
import { upsertEventAccess } from '../db-actions/upsert-event-access';
import { getRecentEvent } from '../db-actions/get-recent-event';
import { getScheduleWithEvents } from '../db-actions/get-schedules-with-events';

dotenv.config();

export interface EventStatus {
    status: number
    currentSeconds: number
    progressPercentage: number
}

export interface EventProps {
    "id": number
    "name": string
    "length": number
    "event_type": string
    "last_state_change": string
    "access_level": string
}

export interface MinimalEventProps {
    id: number,
    length: number
}

export interface EventPropsPure {
    "id": number
    "name": string
    "length": number
    "type": string
    "created_at": string
}

//todo: rename to entry
export interface EventStateResItem {
    id: string,
    cur: number,
    len: number,
    stt: number
}

export class EventStateController {
    /**
     * Create or update event state and add history entry
     */
    static async createOrUpdateEventState(userHandler: any, eventId: any, state: any): Promise<any> {
        dd('userHandler')
        dd(userHandler)
        const pool = createPool();
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();

            // Check if event exists and user has access
            const [eventWithAccess] = await connection.execute(
                `SELECT e.id, e.length, etu.access_level FROM events e 
                 INNER JOIN eventToUser etu ON e.id = etu.event_id 
                 WHERE e.id = ? AND etu.user_handler = ?
                 LIMIT 1`,
                [eventId, userHandler]
            );

            if (eventWithAccess.length === 0) {
                throw new Error('Event not found or access denied');
            }

            const upsertStateResult = await upsertEventState(connection, eventId, state) // todo add false return if no updated
            
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

            await addEventStateHistory(connection, eventId, state)

            const eventProps: EventPropsPure = eventWithAccess[0];
            dd(eventProps)
            // { id: 195, length: 25 }  ensureArray
            const updatedEventsWithStatus: EventStateResItem[] = await this.buildTikEvents(connection, eventProps);
            dd(updatedEventsWithStatus)
            // {
            //   id: 195,
            //   length: 25,
            //   status: 2,
            //   currentSeconds: 9,
            //   progressPercentage: 36
            // }
            await connection.commit();

            const tikAction = 'update';
            const updatedEventStatusWithTikAction = OuterSyncService.addOuterActionInEvents(updatedEventsWithStatus, tikAction);
            dd(updatedEventStatusWithTikAction)
            // [
            //   {
            //     id: 195,
            //     length: 25,
            //     status: 2,
            //     currentSeconds: 9,
            //     progressPercentage: 36,
            //     tikAction: 'update'
            //   }
            // ]

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
            // todo STOPPED HERE           
            return {
                [thisProjectResProp()]: {
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
                        upsertStateResult: upsertStateResult
                    },
                    [tikResProp()]: parseServerResponse(tikResponse),
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
        const pool = createPool();
        const connection = await pool.getConnection();
        try {
            const [events] = await connection.execute(
                `SELECT 
                    e.id,
                    e.name,
                    e.length,
                    et.name as event_type,
                    es.state as current_state,
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
            return productEntriesForTik;
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
            
            const eventStatus: EventStatus = await this.calculateEventStatus(connection, eventProps);
            // dd(eventStatus);
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

    static async getRecentEventOrSchedule(userHandler) {
        const pool = createPool();
        const connection = await pool.getConnection();

        let getRecentEventResult;
        let getSchduleWithEventsResult;

        getRecentEventResult = await getRecentEvent(connection, userHandler);
        const [recentEvent] = getRecentEventResult.result;

        if (recentEvent.schedule_id) {
            getSchduleWithEventsResult = await getScheduleWithEvents(connection, userHandler, recentEvent.schedule_id)
        }

        return {
            data: {
                recentEvent,
                recentSchedule: getSchduleWithEventsResult.result,
            },
            debug: {
                [thisProjectResProp()]: {
                    getRecentEventResult,
                    getSchduleWithEventsResult
                },
            }
        }
    }
    /**
     * Calculate event status and current seconds based on state and history
     */
    static async calculateEventStatus(connection, event: MinimalEventProps): Promise<EventStatus> {
        const eventId = event.id;
        const eventLengthSeconds = event.length;
        
        // Get current state from eventState table (not from events table)
        const [currentStateResult] = await connection.execute(
            `SELECT event_state_id FROM eventState WHERE eventId = ?`,
            [eventId]
        );
        
        const currentState = currentStateResult.length > 0 ? currentStateResult[0].event_state_id : null;

        // If event is stopped/inactive
        if (currentState === 0 || currentState === null) {
            return {
                status: eventProgress.STOPPED,
                currentSeconds: 0,
                progressPercentage: 0
            };
        }

        // Get all state history for this event
        const [history] = await connection.execute(
            `SELECT event_state_id, created_at 
             FROM eventStateHistory 
             WHERE eventId = ? 
             ORDER BY created_at ASC`,
            [eventId]
        );

        if (history.length === 0) {
            return {
                status: eventProgress.STOPPED,
                currentSeconds: 0,
                progressPercentage: 0
            };
        }

        let totalActiveSeconds = 0;
        let activeStartTime: Date | null = null;

        // Calculate total active time from history
        for (const record of history) {
            if (record.event_state_id === 1 && activeStartTime === null) {
                // Start of active period - create UTC date
                activeStartTime = new Date(record.created_at + 'Z');
            } else if ((record.event_state_id === 0 || record.event_state_id === 2) && activeStartTime !== null) {
                // End of active period - calculate duration with UTC date
                const activeEndTime = new Date(record.created_at + 'Z');
                const diff = activeEndTime.getTime() - activeStartTime.getTime();
                const durationSeconds = Math.floor(diff / 1000);
                totalActiveSeconds += durationSeconds;
                activeStartTime = null;
            }
        }

        // If currently active and we have an open active period
        if (currentState === 1 && activeStartTime !== null) {
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
        const progressPercentage = (currentSeconds / eventLengthSeconds) * 100;

        if (currentState === 1) {
            return {
                status: currentSeconds >= eventLengthSeconds ? eventProgress.COMPLETED : eventProgress.PLAYING,
                currentSeconds: currentSeconds,
                progressPercentage: progressPercentage
            };
        } else if (currentState === 2) {
            return {
                status: eventProgress.PAUSED,
                currentSeconds: currentSeconds,
                progressPercentage: progressPercentage
            };
        }

        return {
            status: eventProgress.STOPPED,
            currentSeconds: 0,
            progressPercentage: 0
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
                const eventStatus = await this.calculateEventStatus(connection, eventProps);
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