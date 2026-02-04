

import { MinimalEventProps } from "../controllers/eventStateController";
import { dd } from "../utils/dd";
import { Nullable } from "../utils/utility.types";
import { DbActionResult } from "./create-event";

export const getEventState = async (
	connection, 
	event: MinimalEventProps,
): Promise<DbActionResult<number>> => {
	
	const res: DbActionResult<number> = {
		success: false,
		result: null,
		error: null
	}
	
	try {

		const [queryResult] = await connection.execute(
			`SELECT event_state_id FROM eventState WHERE eventId = ?`,
			[event.id]
		);

		if (!queryResult?.[0]) {
			throw new Error('no event state')
		}

		res.result = queryResult[0]?.event_state_id as number;        
		res.success = true;

		return res;
	} catch (error: any) {
		dd(error.message)
		res.error = error.message
		
		return res;
	}
}