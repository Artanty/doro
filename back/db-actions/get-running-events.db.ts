import { DbActionResult } from "../types/db-action.types";
import { dd } from "../utils/dd";
import { GetEventsQueryBuilder } from "./get-event.db.builder";

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
    try {
        
        const queryBuilder = new GetEventsQueryBuilder(userHandler);
        
        const [rows] = await queryBuilder
            .isPlaying()
            .execute(connection);
        dd(rows)
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