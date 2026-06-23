import { DbActionResult } from "../types/db-action.types";
import { GetEventsQueryBuilder } from "./get-event.db.builder";

export interface GetEventResItem {
    "id": number
    "name": string
    "length": number
    "schedule_id": number,
    "schedule_position": number,
    "created_by": string,
};


export const getEventDb = async (
    connection: any, 
    userHandler: string, 
    filters: any
): Promise<DbActionResult<GetEventResItem[]>> => {
    
    try {
       
        const queryBuilder = new GetEventsQueryBuilder(userHandler);

        const [rows] = await queryBuilder
        .allEvents()
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
            result: null,
            error: error.message
        };
    }
}