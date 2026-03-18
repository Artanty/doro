import { dd } from "../utils/dd";
import { getUTCDatetime } from "../utils/get-utc-datetime";
import { Nullable } from "../utils/utility.types";

export interface DbActionResult<T = any> {
	success: boolean;
	result: Nullable<T>;
	error: null | string;
}

export const createEvent = async (
	connection: any, 
	name: string,
	length: number,
	type: number,
	userHandler: string,
	schedule_id: number,
	schedule_position: number,
	base_access: number = 0,
	created_from: string = '',

): Promise<DbActionResult> => {

	const res = {
		success: false,
		result: null,
		error: null
	}
	debugger;
	try {
		const [eventResult] = await connection.execute(
			'INSERT INTO events (name, length, type, created_at, created_by, base_access_id, created_from, schedule_id, schedule_position) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
			[name, length, type, getUTCDatetime(), userHandler, base_access, created_from, schedule_id, schedule_position]
		);
                
		res.success = true;
		res.result = eventResult.insertId;

		return res;
	} catch (error: any) {
		dd(error.message)
		res.error = error.message

		return res;
	}
}

