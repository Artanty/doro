import createPool from '../core/db_connection';

export class EventStateController {
    /**
     * Create or update event state (one-to-one relationship)
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
            
            const [result] = await connection.execute(
                `INSERT INTO eventState (eventId, state) 
                 VALUES (?, ?) 
                 ON DUPLICATE KEY UPDATE 
                     state = ?, 
                     updated_at = CURRENT_TIMESTAMP`,
                [eventId, state, state])

            await connection.commit();
            
            return {
                eventId,
                state,
                userHandler,
                created: result.affectedRows === 1,
                updated: result.affectedRows === 2
            };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
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
     * Get event state by eventId and connectionId
     */
    static async getEventState(eventId: any, connectionId: any) {
        const pool = createPool();
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.execute(
                `SELECT es.*, e.name as event_name 
                 FROM eventState es 
                 INNER JOIN events e ON es.eventId = e.id 
                 WHERE es.eventId = ? AND es.connectionId = ?`,
                [eventId, connectionId]
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
     * Get event state by connectionId (one-to-one lookup)
     */
    static async getEventStateByConnection(connectionId: any) {
        const pool = createPool();
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.execute(
                `SELECT es.*, e.name as event_name, e.length, e.type 
                 FROM eventState es 
                 INNER JOIN events e ON es.eventId = e.id 
                 WHERE es.connectionId = ?`,
                [connectionId]
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

    // /**
    //  * Get event states by user handler
    //  */
    // static async getEventStatesByUser(userHandler: any) {
    //     const pool = createPool();
    //     const connection = await pool.getConnection();
    //     try {
    //         const [rows] = await connection.execute(
    //             `SELECT es.*, e.name as event_name, e.length, e.type 
    //              FROM eventState es 
    //              INNER JOIN events e ON es.eventId = e.id 
    //              WHERE es.userHandler = ? 
    //              ORDER BY es.updated_at DESC`,
    //             [userHandler]
    //         );

    //         return rows;
    //     } catch (error) {
    //         throw error;
    //     } finally {
    //         connection.release();
    //     }
    // }
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
    static async deleteEventState(eventId: any, connectionId: any) {
        const pool = createPool();
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const [result] = await connection.execute(
                'DELETE FROM eventState WHERE eventId = ? AND connectionId = ?',
                [eventId, connectionId]
            );

            if (result.affectedRows === 0) {
                throw new Error('Event state not found');
            }

            await connection.commit();

            return {
                eventId,
                connectionId,
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
                    state, 
                    COUNT(*) as count,
                    MAX(updated_at) as last_updated
                 FROM eventState 
                 WHERE userHandler = ? 
                 GROUP BY state 
                 ORDER BY state`,
                [userHandler]
            );

            return rows;
        } catch (error) {
            throw error;
        } finally {
            connection.release();
        }
    }
}