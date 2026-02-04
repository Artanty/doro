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
	base_access: number = 0,
): Promise<DbActionResult> => {

	const res = {
		success: false,
		result: null,
		error: null
	}
	
	try {
		const [eventResult] = await connection.execute(
			'INSERT INTO events (name, length, type, created_at, created_by, base_access_id) VALUES (?, ?, ?, ?, ?, ?)',
			[name, length, type, getUTCDatetime(), userHandler, base_access]
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

