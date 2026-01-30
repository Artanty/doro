import { dd } from "../utils/dd";
import { getUTCDatetime } from "../utils/get-utc-datetime";
// WHEN base_access = 'owner' THEN 3
// WHEN base_access = 'editor' THEN 2
// WHEN base_access = 'viewer' THEN 1

export const ACCESS_CASE = {
	DELETE: 3,
	UPDATE: 2
}

interface DbActionResult {
	success: boolean;
	result: any;
	error: null | string;
	debug?: any
}

/**
 * у ивента есть created_by и base_access_id
 * если userHandler !== created_by
 * смотрим base_access_id
 * если base_access_id < accessLevel
 * смотрим таблицу eventToUser, где
 * user_handler = user_handler && accessLevel <= access_level_id
 * 
 * */
export const getAccessibleEvent = async (
	connection: any, 
	eventId: any, 
	userHandler: string,
	accessLevel: number = 1
): Promise<DbActionResult> => {

	let isOwner = false,
		isPublicAccessible = false,
		sharedAccessResult;

	const res = {
		success: false,
		result: {},
		error: null,
		debug: {
			isOwner,
			isPublicAccessible,
			sharedAccessResult,
		}
	}

	
	
	try {
		// // Check if event exists and user has access
		// const [eventWithAccess] = await connection.execute(
		// 	`SELECT e.*
		//         FROM events e
		//         INNER JOIN eventToUser etu ON e.id = etu.event_id
		//         WHERE e.id = ? AND etu.user_handler = ?
		//         LIMIT 1`,
		// 	[eventId, userHandler]
		// );
		// if (eventWithAccess.length < 1) {
		// 	throw new Error('no eventWithAccess entry found')
		// }
		const [event] = await connection.execute(
			`SELECT * FROM events WHERE id = ?`,
			[eventId]
		);

		isOwner = event[0].created_by === userHandler;
		if (!isOwner) {
			isPublicAccessible = event[0].base_access_id >= accessLevel;
			if (!isPublicAccessible) {
				sharedAccessResult = await connection.execute(
					`SELECT * FROM eventToUser WHERE event_id = ? 
						AND user_handler = ?
						AND access_level_id >= ?;`,
					[eventId, userHandler, accessLevel]);
				if (sharedAccessResult.length < 1) {
					throw new Error('no appropriate access to this event found')
				}
			}
		}
		res.success = true;
		res.result = event;

		return res;
	} catch (error: any) {
		dd(error.message)
		res.error = error.message

		return res;
	}
}

