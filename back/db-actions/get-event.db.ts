import { DbActionResult } from "../types/db-action.types";
import { GetEventsQueryBuilder } from "./get-event.db.builder";

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
        // const intervalDays = filters?.interval || 1;
        // const limit = filters?.limit || 200;

        // const query = `
        //     SELECT 
        //         s.id AS schedule_id,
        //         s.name AS schedule_name,
        //         s.is_playing,
        //         e.id,
        //         e.name AS event_name,
        //         e.length AS event_length,
        //         e.is_rest,
        //         e.schedule_position,
        //         e.playhead,
        //         s.created_by AS schedule_owner
        //     FROM schedules s
        //     INNER JOIN events e ON e.id = s.active_event_id
            
        //     AND (
        //         s.created_by = ?
        //         OR EXISTS (
        //             SELECT 1 
        //             FROM scheduleToUser stu
        //             WHERE stu.schedule_id = s.id
        //                 AND stu.user_handler = ?
        //                 AND stu.access_level_id >= 1
        //         )
        //     )
        //     ORDER BY s.id
        // `;

        const queryBuilder = new GetEventsQueryBuilder(userHandler);

        const [rows] = await queryBuilder.execute(connection);

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
            result: null,
            error: error.message
        };
    }
}