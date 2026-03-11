

import { EventPropsDbItem } from "../types/event.types";
import { dd } from "../utils/dd";
import { DbActionResult } from "./create-event";

export const getRecentEvent = async (
	connection, 
	userHandler,
): Promise<DbActionResult<EventPropsDbItem>> => {
	
	const res: DbActionResult<EventPropsDbItem> = {
		success: false,
		result: null,
		error: null
	}
	
	try {
		const [queryResult] = await connection.execute(
			`SELECT 
		        e.*
		      FROM events e
		      INNER JOIN eventState es ON e.id = es.eventId
		      WHERE e.created_by = ?
		      ORDER BY es.updated_at DESC
		      LIMIT 1`, [userHandler]
		);
                
		res.success = true;
		res.result = queryResult[0];

		return res;
	} catch (error: any) {
		dd(error.message)
		res.error = error.message
		
		return res;
	}
}