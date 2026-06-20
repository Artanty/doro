import { DbActionResult } from "../types/db-action.types";
import { dd } from "../utils/dd";

export const updateScheduleActiveEventDb = async (
	connection: any, 
	eventId,
	scheduleId
): Promise<DbActionResult> => {

	const res: DbActionResult = {
		success: false,
		result: null,
		error: null
	}
	
	try {
		const query = `
	        UPDATE schedules 
	        SET active_event_id = ? 
	        WHERE id = ?;
	    `;
	    
		const [result] = await connection.execute(query, [eventId, scheduleId]);

		res.result = result;
		res.success = true;

		return res;

	} catch (error: any) {
		dd(error.message);
		res.error = error.message;
		return res;
	}
}

