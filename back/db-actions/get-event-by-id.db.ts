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


export const getEventByIdDb = async (
    connection: any, 
    userHandler: string, 
    eventId: number
): Promise<DbActionResult<GetEventResItem[]>> => {
    
    try {
       
        const queryBuilder = new GetEventsQueryBuilder(userHandler);

        const [rows] = await queryBuilder
        .eventId(eventId)
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