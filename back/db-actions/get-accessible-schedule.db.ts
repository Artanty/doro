import { DbActionResult } from "../types/db-action.types";

export interface GetAccessibleScheduleEventRes {
    id: number,
    name: string,
    length: number,
    is_rest: number,
    schedule_id: number,
    schedule_position: number,
    playhead: number
}

export interface GetAccessibleScheduleRes {
    id: number,
    name: string,
    created_by: string,
    created_at: string,
    updated_at: string,
    active_event_id: number,
    is_playing: number,
    event: GetAccessibleScheduleEventRes
}

export async function getAccessinleScheduleDb(
    connection: any,
    userHandler: string,
    scheduleId: number,
    eventId?: number
): Promise<DbActionResult<GetAccessibleScheduleRes>> {
    const res: any = {
        success: false,
        result: null,
        error: null
    }

    try {
        let query = `
            SELECT s.*
            FROM schedules s
            WHERE s.id = ?
            AND (s.created_by = ? OR EXISTS (
                SELECT 1 FROM scheduleToUser
                WHERE schedule_id = s.id
                    AND user_handler = ?
                    AND access_level_id >= 2
            ))
        `;
        
        const params: any[] = [scheduleId, userHandler, userHandler];

        // If eventId is provided, also fetch the event
        if (eventId !== undefined && eventId !== null) {
            query = `
                SELECT s.*, 
                       e.id AS event_id,
                       e.name AS event_name,
                       e.length AS event_length,
                       e.is_rest AS event_is_rest,
                       e.schedule_id AS event_schedule_id,
                       e.schedule_position AS event_schedule_position,
                       s.event_playhead AS event_playhead
                FROM schedules s
                LEFT JOIN events e ON e.id = ? AND e.schedule_id = s.id
                WHERE s.id = ?
                AND (s.created_by = ? OR EXISTS (
                    SELECT 1 FROM scheduleToUser
                    WHERE schedule_id = s.id
                        AND user_handler = ?
                        AND access_level_id >= 2
                ))
            `;
            params.unshift(eventId); // Add eventId at the beginning
        }

        const [scheduleRows] = await connection.execute(query, params);

        if (scheduleRows.length === 0) {
            throw new Error('No access or schedule not found');
        }

        const result = scheduleRows[0];
        
        // Format response
        const response: GetAccessibleScheduleRes = {
            id: result.id,
            name: result.name,
            created_by: result.created_by,
            created_at: result.created_at,
            updated_at: result.updated_at,
            active_event_id: result.active_event_id,
            is_playing: result.is_playing,
            event: {
                id: 0,
                name: '',
                length: 0,
                is_rest: 0,
                schedule_id: 0,
                schedule_position: 0,
                playhead: 0
            }
        };

        // Add event if it exists
        if (eventId !== undefined && eventId !== null && result.event_id) {
            response.event = {
                id: result.event_id,
                name: result.event_name,
                length: result.event_length,
                is_rest: result.event_is_rest,
                schedule_id: result.event_schedule_id,
                schedule_position: result.event_schedule_position,
                playhead: result.event_playhead
            };
        }

        res.success = true;
        res.result = response;

        return res;
    } catch (error: any) {
        res.error = error.message;
        return res;
    }
}

// export async function getAccessinleScheduleDb(
//     connection: any,
//     userHandler: string,
//     scheduleId: number,
//     eventId?: number
// ): Promise<DbActionResult<GetAccessibleScheduleRes>> {
//     const res: any = {
// 		success: false,
// 		result: null,
// 		error: null
// 	}

//     try {
//         const [scheduleRows] = await connection.execute(
//             `SELECT s.*
//             FROM schedules s
//             WHERE s.id = ?
//             AND (s.created_by = ? OR EXISTS (
//                 SELECT 1 FROM scheduleToUser
//                 WHERE schedule_id = s.id
//                     AND user_handler = ?
//                     AND access_level_id >= 2
//             ))`,
//             [scheduleId, userHandler, userHandler]
//         );

//         if (scheduleRows.length === 0) {
//             throw new Error('No access or schedule not found');
//         }

//         res.success = true;
// 		res.result = scheduleRows[0];

// 		return res;
//     } catch (error: any) {
//         res.error = error.message

//         return res;
//     }
// }