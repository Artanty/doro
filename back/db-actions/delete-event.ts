import { dd } from "../utils/dd";
import { getUTCDatetime } from "../utils/get-utc-datetime";
import { Nullable } from "../utils/utility.types";
import { DbActionResult } from "./create-event";

export const deleteEvent = async (
	connection: any, 
	eventId: number,
): Promise<DbActionResult> => {

	const res = {
		success: false,
		result: null,
		error: null
	}
	
	try {
		const [result] = await connection.execute(
			'DELETE FROM events WHERE id = ?',
			[eventId]
		);
                
		res.success = true;
		res.result = result.affectedRows

		return res;
	} catch (error: any) {
		dd(error.message)
		res.error = error.message

		return res;
	}
}

