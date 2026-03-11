import createPool from '../../core/db_connection';
import axios from 'axios';
import dotenv from 'dotenv';
import { dd } from '../../utils/dd';
import { thisProjectResProp } from '../../utils/getResProp';

dotenv.config();

export const getEventCtl = async (userHandler: string) => {
    const pool = createPool();
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute(
            `SELECT 
        e.*, 
        etu.access_level, 
        es.event_state_id as current_state,
        CASE 
            WHEN e.base_access_id IN (1, 2, 3) THEN TRUE
            ELSE FALSE
        END as has_access,
        COALESCE(
            (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id', esh.id,
                        'trigger_event_state_id', esh.trigger_event_state_id,
                        'action_type', esh.action_type,
                        'action_config', esh.action_config,
                        'created_at', esh.created_at,
                        'updated_at', esh.updated_at
                    )
                )
                FROM eventStateHooks esh
                WHERE esh.event_id = e.id
            ),
            JSON_ARRAY()
        ) as state_hooks
    FROM events e
    LEFT JOIN eventToUser etu 
        ON e.id = etu.event_id AND etu.user_handler = ?
    LEFT JOIN eventState es ON e.id = es.eventId
    WHERE e.created_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 1 DAY)
    ORDER BY e.created_at DESC`,
            [userHandler]
        );

        return {
            data: rows,
            debug: {
                [thisProjectResProp()]: {
                    data: rows,
                },
            }
        };
    } catch (error) { 
        console.log(error);
        throw error;
    } finally {
        connection.release();
    }
}	