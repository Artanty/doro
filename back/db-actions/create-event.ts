import { dd } from "../utils/dd";
import { getUTCDatetime } from "../utils/get-utc-datetime";

interface DbActionResult {
	success: boolean;
	result: any;
	error: null | string;
}

export const createEvent = async (
	connection: any, 
	name: string,
	length: number,
	type: number,
	userHandler: string, // todo owner
): Promise<DbActionResult> => {

	const res = {
		success: false,
		result: null,
		error: null
	}
	
	try {
		const [eventResult] = await connection.execute(
			'INSERT INTO events (name, length, type, created_at) VALUES (?, ?, ?, ?)',
			[name, length, type, getUTCDatetime()]
		);
                
		res.success = true;
		res.result = eventResult.insertId;
	} catch (error: any) {
		dd(error.message)
		res.error = error.message
		return res;
	}
	return res;
}

