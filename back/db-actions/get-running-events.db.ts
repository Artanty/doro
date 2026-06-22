import { DbActionResult } from "../types/db-action.types";
import { dd } from "../utils/dd";

export interface GetRunningEventsResItem {
    "id": number
    "name": string
    "length": number
    // "type": number
    // "created_at": string
    // "updated_at": string | null,
    // "schedule_id": number,
    // "schedule_position": number,
    // "created_by": string, //todo remve
    // "base_access_id": number //todo remve
    // event_state_id: number
};

export const getRunningEventsDb = async (
    connection: any,
    userHandler: string
): Promise<DbActionResult<GetRunningEventsResItem[]>> => {
    dd(userHandler)
    try {
        const query = `
            SELECT 
                s.id AS schedule_id,
                s.name AS schedule_name,
                s.is_playing,
                e.id AS event_id,
                e.name AS event_name,
                e.length AS event_length,
                e.is_rest,
                e.schedule_position,
                e.playhead,
                s.created_by AS schedule_owner
            FROM schedules s
            INNER JOIN events e ON e.id = s.active_event_id
            WHERE s.is_playing = 1
            AND (
                s.created_by = ?
                OR EXISTS (
                    SELECT 1 
                    FROM scheduleToUser stu
                    WHERE stu.schedule_id = s.id
                        AND stu.user_handler = ?
                        AND stu.access_level_id >= 1
                )
            )
            ORDER BY s.id
        `;

        const [rows] = await connection.execute(query, [userHandler, userHandler]);

        return {
            success: true,
            result: rows,
            error: null,
            debug: {
                // filters_applied: {
                //     interval_days: intervalDays,
                //     limit: limit
                // }
            }
        };
    } catch (error: any) { 
        return {
            success: false,
            result: [],
            error: error.message
        };
    }
}