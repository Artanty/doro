import { eventProgress } from '../core/constants';
import createPool from '../core/db_connection';
import dotenv from 'dotenv';

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
    static async createOrUpdateEventState(eventId: any, state: any, userHandler: any) {
        const pool = createPool();
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Check if event exists and user has access
            const [eventAccess] = await connection.execute(
                `SELECT e.id FROM events e 
             INNER JOIN eventToUser etu ON e.id = etu.event_id 
             WHERE e.id = ? AND etu.user_handler = ?`,
                [eventId, userHandler]
            );

            if (eventAccess.length === 0) {
                throw new Error('Event not found or access denied');
            }

            // Get current state before update for history comparison
            const [currentState] = await connection.execute(
                `SELECT state FROM eventState WHERE eventId = ?`,
                [eventId]
            );

            const previousState = currentState.length > 0 ? currentState[0].state : null;
        
            // Only proceed if state is actually changing
            if (previousState !== state) {
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

                await connection.commit();
            
                return {
                    eventId,
                    state,
                    userHandler,
                    created: result.affectedRows === 1,
                    updated: result.affectedRows === 2,
                    stateChanged: true
                };
            } else {
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
            const eventsWithStatus = await Promise.all(
                events.map(async (eventProps: EventProps) => {
                    const eventStatus = await this._calculateEventStatus(connection, eventProps);
                    const res: EventStateResItem = {
                        id: `e_${eventProps.id}`,
                        cur: eventStatus.currentSeconds,
                        len: eventProps.length,
                        prc: eventStatus.progressPercentage,
                        stt: eventStatus.status
                    }

                    return res;
                })
            );

            return eventsWithStatus;
        } catch (error) {
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Calculate event status and current seconds based on state and history
     */
    static async _calculateEventStatus(connection, event): Promise<EventStatus> {
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
}