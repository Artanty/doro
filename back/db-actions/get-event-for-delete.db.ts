import { DbActionResult } from "../types/db-action.types";
import { GetEventsQueryBuilder } from "./get-event.db.builder";

export interface GetEventForDeleteResItem {
    "id": number,
    "name": string,
    "length": number,
    "is_rest": number,
    "updated_at": string,
    "schedule_id": number,
    "schedule_name": string,
    "schedule_is_playing": number,
    "schedule_active_event_id": number,
    "schedule_position": number,
    "schedule_owner": string,
    "is_active_event": number,
    "schedule_total_events": number,
}


export const getEventForDeleteDb = async (
    connection: any, 
    userHandler: string, 
    eventId: number
): Promise<DbActionResult<GetEventForDeleteResItem[]>> => {
    
    const res: DbActionResult = {
		success: false,
		result: null,
		error: null
	}

    try {
       
        const builder = new GetEventsQueryBuilder(userHandler);
		const [rows] = await builder
			.eventId(eventId)
			.countEventsForSchedule()
			.execute(connection);

        if (!rows.length) {
            throw new Error(`getEventForDeleteDb err: no items retrieved by id: ${eventId}`);
        }

        if (!rows[0].schedule_total_events){
			throw new Error(`getEventForDeleteDb err: no total events in schedule ${rows[0].schedule_id}`);
		}

        res.success = true;
        res.result = rows;
        
    } catch (error: any) {
        res.error = error.message;
    } finally {
        return res;
    }
}