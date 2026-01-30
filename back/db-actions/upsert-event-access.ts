import { dd } from "../utils/dd";
import { getUTCDatetime } from "../utils/get-utc-datetime";

interface DbActionResult {
	success: boolean;
	result: any;
	error: null | string;
}

export const upsertEventAccess = async (
	connection: any, 
	eventId, 
	userHandler: string,
	accessLevel: string | number, //number, // todo change to number
): Promise<DbActionResult> => {

	const res = {
		success: false,
		result: null,
		error: null
	}
	accessLevel = 3; // todo
	try {
		const [queryResult] = await connection.execute(
			'INSERT INTO eventToUser (event_id, user_handler, access_level_id, created_at) VALUES (?, ?, ?, ?)',
			[eventId, userHandler, accessLevel, getUTCDatetime()]
		);
                
		res.success = true;
		res.result = queryResult.insertId;
	} catch (error: any) {
		dd(error.message)
		res.error = error.message
		return res;
	}
	return res;
}

