import { dd } from "../utils/dd";
import { getUTCDatetime } from "../utils/get-utc-datetime";

interface AddEventStateHistoryResult {
	success: boolean;
	result: null | number;
	error: null | string;
}

export const addEventStateHistory = async (
	connection: any, 
	eventId: any, 
	state: any, 
): Promise<AddEventStateHistoryResult> => {

	const res = {
		success: false,
		result: null,
		error: null
	}
	
	try {
		const [result] = await connection.execute(
			`INSERT INTO eventStateHistory (eventId, event_state_id, created_at) 
	 			VALUES (?, ?, ?)`,
			[eventId, state, getUTCDatetime()]
		);

		res.success = true;
		res.result = result.insertId;	
	} catch (error: any) {
		dd(error.message)
		res.error = error.message
		return res;
	}
	return res;
}

