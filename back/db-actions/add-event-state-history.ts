import { getUTCDatetime } from "../utils/get-utc-datetime";

export const addEventStateHistory = async (
	connection: any, 
	eventId: any, 
	state: any, 
): Promise<void> => {

	const res = {
		isStateUpdated: false,
		result: null,
	}
	
	await connection.execute(
		`INSERT INTO eventStateHistory (eventId, state, created_at) 
 			VALUES (?, ?, ?)`,
		[eventId, state, getUTCDatetime()]
	);

}