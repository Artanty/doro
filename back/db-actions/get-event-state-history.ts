import { EventStateHistoryDbItem } from "../types/event-state-history.types";
import { MinimalEventProps } from "../types/event-state.types";
import { dd } from "../utils/dd";
import { Nullable } from "../utils/utility.types";
import { DbActionResult } from "./create-event";

export const getEventStateHistory = async (
	connection, 
	eventId: number,
): Promise<DbActionResult<EventStateHistoryDbItem[]>> => {
	
	const res: DbActionResult<EventStateHistoryDbItem[]> = {
		success: false,
		result: null,
		error: null
	}
	
	try {
		const [queryResult] = await connection.execute(
			`SELECT event_state_id, created_at 
             FROM eventStateHistory 
             WHERE eventId = ? 
             ORDER BY created_at ASC`,
			[eventId]
		);

		if (!queryResult?.[0]) {
			throw new Error('no event state history')
		}

		res.result = queryResult;        
		res.success = true;

		return res;
	} catch (error: any) {
		
		res.error = error.message
		
		return res;
	}
}