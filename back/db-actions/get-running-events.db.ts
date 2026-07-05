import { DbActionResult } from "../types/db-action.types";
import { dd } from "../utils/dd";
import { GetEventsQueryBuilder } from "./get-event.db.builder";

export interface GetRunningEventsResItem {
    id: number,
    name: string,
    length: number,
    is_rest: number,
    updated_at: string,
    schedule_id: number,
    schedule_name: string,
    schedule_is_playing: number,
    schedule_active_event_id: number,
    schedule_event_playhead: number,
    schedule_position: number,
    schedule_owner: string
    is_active_event: boolean
};
    
    
export const getRunningEventsDb = async (
    connection: any,
    userHandler: string
): Promise<DbActionResult<GetRunningEventsResItem[]>> => {
    try {
        
        const queryBuilder = new GetEventsQueryBuilder(userHandler);
        
        const [rows] = await queryBuilder
            .onlyActiveEvents()
            .scheduleIsPlaying(true)
            .execute(connection);
            
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