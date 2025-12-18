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

export interface EventStateResItem {
    id: string,
    cur: number,
    len: number,
    prc: number,
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
            
            // Only proceed if state is actually changing
            // Get current state before update for history comparison

            const [currentState] = await connection.execute(
                `SELECT state FROM eventState WHERE eventId = ?`,
                [eventId]
            );

            const previousState = currentState.length > 0 ? currentState[0].state : null;
            if (previousState === state) {
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

            // Update or insert current state
            const [result] = await connection.execute(
                `INSERT INTO eventState (eventId, state) 
             VALUES (?, ?) 
             ON DUPLICATE KEY UPDATE 
                 state = VALUES(state), 
                 updated_at = CURRENT_TIMESTAMP`,
                [eventId, state]
            );

            // Add entry to history table
            await connection.execute(
                `INSERT INTO eventStateHistory (eventId, state) 
             VALUES (?, ?)`,
                [eventId, state]
            );

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
            const updatedEventStatusWithTikAction = this.addTikActionForEvents(updatedEventsWithStatus, tikAction);
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
                [tikResProp()]: parseServerResponse(tikResponse)
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

            const eventsWithTikAction = this.addTikActionForEvents(eventsWithStatus, 'add');

            console.log(eventsWithTikAction)
            return eventsWithTikAction;
        } catch (error) {
            throw error;
        } finally {
            connection.release();
        }
    }

    static addTikActionForEvents<T = any>(events: T | T[], action: string): T[] {
        events = ensureArray(events)
        return events.map(el => {
            el = { ...el, [EVENT_TIK_ACTION_PROP]: action } //todo pass propName?
            return el;
        })
    }

    /**
     * play event if it is not completed (states: 'STOPPED': 0,'PAUSED': 2)
     * if completed ('COMPLETED': 3) - duplicate event, then createOrUpdateEventState(1)
     * */
    static async playOrDuplicateEvent(userHandler: any, eventId: any) {
        const state = eventProgress.PLAYING; // 1
        const pool = createPool();
        const connection = await pool.getConnection();
        let createdEventId;
        try {
            await connection.beginTransaction();

            // Check if event exists and user has access
            const [eventWithAccess] = await connection.execute(
                `SELECT e.*
                    FROM events e
                    INNER JOIN eventToUser etu ON e.id = etu.event_id
                    WHERE e.id = ? AND etu.user_handler = ?
                    LIMIT 1`,
                [eventId, userHandler]
            );
            if (eventWithAccess.length < 1) {
                throw new Error('no event entry found')
            }
         
            const eventProps: EventPropsPure = eventWithAccess[0];
         
            const eventStatus: EventStatus = await this.calculateEventStatus(connection, eventProps);
         
            if (eventStatus.status === eventProgress.STOPPED || eventStatus.status === eventProgress.PAUSED) {
                dd('CHANGING STATE (PLAYING) OF EXISTING EVENT')
                
                const [result] = await connection.execute(
                    `INSERT INTO eventState (eventId, state) 
                 VALUES (?, ?) 
                 ON DUPLICATE KEY UPDATE 
                     state = VALUES(state), 
                     updated_at = CURRENT_TIMESTAMP`,
                    [eventId, state]
                );
                
                // Add entry to history table
                await connection.execute(
                    `INSERT INTO eventStateHistory (eventId, state) 
                 VALUES (?, ?)`,
                    [eventId, state]
                );

            } else if (eventStatus.status === eventProgress.COMPLETED) {
                dd('DUPLICATING EVENT')
                const name = eventProps.name;
                const length = eventProps.length;
                const type = eventProps.type;
                const accessLevel = 'owner';

                const [eventResult] = await connection.execute(
                    'INSERT INTO events (name, length, type) VALUES (?, ?, ?)',
                    [name, length, type]
                );
                createdEventId = eventResult.insertId;

                // Create owner relationship in eventToUser
                await connection.execute(
                    'INSERT INTO eventToUser (event_id, user_handler, access_level) VALUES (?, ?, ?)',
                    [createdEventId, userHandler, accessLevel]
                );

                const [result] = await connection.execute(
                    `INSERT INTO eventState (eventId, state) 
                     VALUES (?, ?)`,
                    [createdEventId, eventProgress.PLAYING]
                );

                // Add entry to history table
                await connection.execute(
                    `INSERT INTO eventStateHistory (eventId, state) 
                 VALUES (?, ?)`,
                    [createdEventId, state]
                );
            } else {
                throw new Error('wrong state of event')
            }
            
            // eventProgress.COMPLETED - add event copy
            const eventPropsForCalc = { id: eventStatus.status === eventProgress.COMPLETED ? createdEventId : eventId, length: eventProps.length }
            dd(eventPropsForCalc)
            dd(eventProgress.COMPLETED)
            dd(eventProgress.COMPLETED ? createdEventId : eventId)
            dd(createdEventId)
            dd(eventId)
            // build event for tik
            const updatedEventsStatus: EventStateResItem[] = await EventStateController.buildTikEvents(connection, eventPropsForCalc);
            await connection.commit();
            dd(updatedEventsStatus)
            const tikAction = eventProgress.COMPLETED ? 'add' : 'update';
            const updatedEventStatusWithTikAction = this.addTikActionForEvents(updatedEventsStatus, tikAction);
            dd(updatedEventStatusWithTikAction)
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
                [thisProjectResProp()]: {
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
                [tikResProp()]: parseServerResponse(tikResponse)
            };
        } catch (error: any) { 
            console.log(error)
            await connection.rollback();
            throw new Error('playOrDuplicateEvent error: ' + (error?.message ?? error));
        } finally {
            connection.release();
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
            `SELECT state FROM eventState WHERE eventId = ?`,
            [eventId]
        );
        
        const currentState = currentStateResult.length > 0 ? currentStateResult[0].state : null;

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
            `SELECT state, created_at 
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
            if (record.state === 1 && activeStartTime === null) {
                // Start of active period
                activeStartTime = new Date(record.created_at);
            } else if ((record.state === 0 || record.state === 2) && activeStartTime !== null) {
                // End of active period - calculate duration
                const activeEndTime = new Date(record.created_at);
                const diff = activeEndTime.getTime() - activeStartTime.getTime();
                const durationSeconds = Math.floor(diff / 1000);
                totalActiveSeconds += durationSeconds;
                activeStartTime = null;
            }
        }

        // If currently active and we have an open active period
        if (currentState === 1 && activeStartTime !== null) {
            const currentTime = new Date();
            const diff = currentTime.getTime() - activeStartTime.getTime();
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
                         WHEN es.state = 1 THEN 1  -- Active first
                         WHEN es.state = 2 THEN 2  -- Paused second
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

    /**
     * Get event state by eventId
     */
    static async getEventState(eventId: any) {
        const pool = createPool();
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.execute(
                `SELECT es.*, e.name as event_name 
                 FROM eventState es 
                 INNER JOIN events e ON es.eventId = e.id 
                 WHERE es.eventId = ?`,
                [eventId]
            );

            if (rows.length === 0) {
                return null;
            }

            return rows[0];
        } catch (error) {
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Get all event states for a specific event
     */
    static async getEventStatesByEvent(eventId: any) {
        const pool = createPool();
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.execute(
                `SELECT es.*, e.name as event_name 
                 FROM eventState es 
                 INNER JOIN events e ON es.eventId = e.id 
                 WHERE es.eventId = ? 
                 ORDER BY es.updated_at DESC`,
                [eventId]
            );

            return rows;
        } catch (error) {
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Get event states by user handler
     */
    static async getEventStatesByUser(userHandler: any) {
        const pool = createPool();
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.execute(
                `SELECT 
                es.*, 
                e.name as event_name, 
                e.length, 
                e.type as event_type_id,
                etu.access_level
             FROM eventState es 
             INNER JOIN events e ON es.eventId = e.id 
             INNER JOIN eventToUser etu ON e.id = etu.event_id
             WHERE etu.user_handler = ? 
             ORDER BY es.updated_at DESC`,
                [userHandler]
            );

            return rows;
        } catch (error) {
            throw error;
        } finally {
            connection.release();
        }
    }
    
    /**
     * Get event states by state value
     */
    static async getEventStatesByState(state: any) {
        const pool = createPool();
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.execute(
                `SELECT es.*, e.name as event_name 
                 FROM eventState es 
                 INNER JOIN events e ON es.eventId = e.id 
                 WHERE es.state = ? 
                 ORDER BY es.updated_at DESC`,
                [state]
            );

            return rows;
        } catch (error) {
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Delete event state
     */
    static async deleteEventState(eventId: any) {
        const pool = createPool();
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const [result] = await connection.execute(
                'DELETE FROM eventState WHERE eventId = ?',
                [eventId]
            );

            if (result.affectedRows === 0) {
                throw new Error('Event state not found');
            }

            await connection.commit();

            return {
                eventId,
                deleted: true
            };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Get event state summary for a user
     */
    static async getUserEventStateSummary(userHandler: any) {
        const pool = createPool();
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.execute(
                `SELECT 
                    es.state, 
                    COUNT(*) as count,
                    MAX(es.updated_at) as last_updated
                 FROM eventState es
                 INNER JOIN eventToUser etu ON es.eventId = etu.event_id
                 WHERE etu.user_handler = ? 
                 GROUP BY es.state 
                 ORDER BY es.state`,
                [userHandler]
            );

            return rows;
        } catch (error) {
            throw error;
        } finally {
            connection.release();
        }
    }
    
    /**
     * Get last event state change for an event
     */
    static async getLastEventStateChange(eventId: any) {
        const pool = createPool();
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.execute(
                `SELECT state, updated_at 
                 FROM eventState 
                 WHERE eventId = ?`,
                [eventId]
            );

            if (rows.length === 0) {
                return null;
            }

            return rows[0];
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
                    prc: eventStatus.progressPercentage,
                    stt: eventStatus.status
                }

                return res;
            })
        );

        return eventsWithStatus;
    }
}