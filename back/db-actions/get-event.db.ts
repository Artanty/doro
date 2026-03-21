import { DbActionResult } from "../types/db-action.types";

export interface GetEventResItem {
    "id": number
    "name": string
    "length": number
    "type": number
    "created_at": string
    "updated_at": string | null,
    "schedule_id": number,
    "schedule_position": number,
    "created_by": string, //todo remve
    "base_access_id": number //todo remve
    event_state_id: number
};


export const getEventDb = async (
    connection: any, 
    userHandler: string, 
    filters: any
): Promise<DbActionResult<GetEventResItem[]>> => {
    
    try {
        // Set default values
        const intervalDays = filters?.interval || 1;
        const limit = filters?.limit || 200;

        const [rows] = await connection.execute(
            `SELECT 
                e.*, 
                etu.access_level, 
                e.event_state_id as current_state,
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
                WHERE e.created_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL ? DAY)
                ORDER BY e.created_at DESC
                LIMIT ?`,
            [userHandler, intervalDays, limit]
        );

        return {
            success: true,
            result: rows,
            error: null,
            debug: {
                filters_applied: {
                    interval_days: intervalDays,
                    limit: limit
                }
            }
        };
    } catch (error: any) { 
        return {
            success: false,
            result: null,
            error: error.message
        };
    } finally {
        connection.release();
    }
}