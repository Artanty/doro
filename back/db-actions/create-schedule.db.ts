import { dd } from "../utils/dd";
import { getUTCDatetime } from "../utils/get-utc-datetime";

export interface DbActionResult {
	success: boolean;
	result: any;
	error: null | string;
}

export const createScheduleDb = async (
	connection: any, 
	userHandler: string,

	name: string,
	active_event_id: number,
	is_playing: boolean
	
): Promise<DbActionResult> => {

	const res = {
		success: false,
		result: null,
		error: null
	}
	
	try {
		const [queryResult] = await connection.execute(
			'INSERT INTO schedules (name, created_by, created_at, updated_at, active_event_id, is_playing) VALUES (?, ?, ?, ?, ?, ?)',
			[name, userHandler, getUTCDatetime(), getUTCDatetime(), active_event_id, is_playing]
		);
                
		res.success = true;
		res.result = queryResult.insertId;

		return res;
	} catch (error: any) {
		dd(error.message)
		res.error = error.message

		return res;
	}
}

