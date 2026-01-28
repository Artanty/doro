import { dd } from "../utils/dd";
import { getUTCDatetime } from "../utils/get-utc-datetime";

interface DbActionResult {
	success: boolean;
	result: any;
	error: null | string;
}

export const getAccessibleEvent = async (
	connection: any, 
	eventId: any, 
	userHandler: string,
	accessLevel: number = 0
): Promise<DbActionResult> => {

	const res = {
		success: false,
		result: null,
		error: null
	}
	
	try {
		// Check if event exists and user has access
		const [eventWithAccess] = await connection.execute(
			`SELECT e.*
                FROM events e
                INNER JOIN eventToUser etu ON e.id = etu.event_id
                WHERE e.id = ? AND etu.user_handler = ?
                LIMIT 1`,
			[eventId, userHandler]
		);
		if (eventWithAccess.length < 1) {
			throw new Error('no event entry found')
		}

		res.success = true;
		res.result = eventWithAccess;
	} catch (error: any) {
		dd(error.message)
		res.error = error.message
		return res;
	}
	return res;
}

