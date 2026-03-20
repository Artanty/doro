import { dd } from "../utils/dd";
import { getUTCDatetime } from "../utils/get-utc-datetime";
import { Nullable } from "../utils/utility.types";
import { DbActionResult } from "./create-event";

export const deleteFinishedEvents = async (
	connection: any,
	eventType: number = 3,
	eventStateId: number = 3
): Promise<DbActionResult<any>> => {

	const res: any = {
		success: false,
		result: null,
		error: null
	}
	
	try {
		const [result] = await connection.execute(
			`DELETE e FROM events e
             WHERE e.type = ? 
             AND e.event_state_id = ?`,
			[eventType, eventStateId]
		);
                
		res.success = true;
		res.result = {
			affectedRows: result.affectedRows,
			message: `Deleted ${result.affectedRows} events with type=${eventType} and event_state_id=${eventStateId}`
		};

		return res;
	} catch (error: any) {
		dd(error.message)
		res.error = error.message

		return res;
	}
}