import { dd } from "../utils/dd";
import { getUTCDatetime } from "../utils/get-utc-datetime";

interface DbActionResult {
	success: boolean;
	result: any;
	error: null | string;
}

export const upsertScheduleAccessDb = async (
	connection: any, 
	
	schedule_id: number,

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
			'INSERT INTO scheduleToUser (schedule_id, access_level_id, user_handler) VALUES (?, ?, ?)',
			[schedule_id, Number(accessLevel), userHandler]
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

