import { dd } from "../utils/dd";
import { getUTCDatetime } from "../utils/get-utc-datetime";

export interface DbActionResult {
	success: boolean;
	result: any;
	error: null | string;
}

export const createSchedule = async (
	connection: any, 
	name: string,
	userHandler: string,
): Promise<DbActionResult> => {

	const res = {
		success: false,
		result: null,
		error: null
	}
	
	try {
		const [queryResult] = await connection.execute(
			'INSERT INTO schedules (name, created_by, created_at, updated_at) VALUES (?, ?, ?, ?)',
			[name, userHandler, getUTCDatetime(), getUTCDatetime()]
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

