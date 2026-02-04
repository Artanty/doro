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
		isPublicAccessible,
		sharedAccessResult;

	const res = {
		success: false,
		result: {},
		error: null,
		debug: {}
	}
	try {
		const [event] = await connection.execute(
			`SELECT * FROM events WHERE id = ?`,
			[eventId]
		);
		dd(event)
		dd(userHandler)
		isOwner = event[0].created_by === userHandler;
		dd(isOwner)
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
		res.debug = {
			isOwner,
			isPublicAccessible,
			sharedAccessResult,
		}

		return res;
	} catch (error: any) {
		dd(error.message)
		res.error = error.message

		return res;
	}
}

