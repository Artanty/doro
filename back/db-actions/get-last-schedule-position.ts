import { dd } from "../utils/dd";
import { DbActionResult } from "./create-event";

export interface GetLastPositionResult {
	last_position: number,
	total_events: number
}
export const getLastSchedulePosition = async (
	connection: any,
	scheduleId: number | string
): Promise<DbActionResult<GetLastPositionResult>> => {
	const res = {
		success: false,
		result: null,
		error: null
	}
    
	try {
		const [queryResult] = await connection.execute(
			`SELECT 
                COALESCE(MAX(schedule_position), 0) as last_position,
                COUNT(*) as total_events
            FROM events 
            WHERE schedule_id = ?`,
			[scheduleId]
		);
                
		res.success = true;
		res.result = queryResult[0]; // Return the first row with last_position and total_events

		return res;
	} catch (error: any) {
		dd(error.message)
		res.error = error.message
        
		return res;
	}
}