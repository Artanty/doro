import { getUTCDatetime } from "../utils/get-utc-datetime";

export interface UpsertEventStateActionRes {
	isStateUpdated: boolean,
	result: any
}

export const upsertEventState = async (
	connection: any, 
	eventId: any, 
	state: any, 
): Promise<UpsertEventStateActionRes> => {

	const res = {
		isStateUpdated: false,
		result: null,
	}
	
	const [currentState] = await connection.execute(
		`SELECT event_state_id FROM eventState WHERE eventId = ?`,
		[eventId]
	);
	const previousState = currentState.length > 0 ? currentState[0].event_state_id : null;

	if (previousState === state) {
		res.isStateUpdated = false;
	} else {
		const [result] = await connection.execute(
			`INSERT INTO eventState (eventId, event_state_id, created_at, updated_at) 
             VALUES (?, ?, ?, ?) 
             ON DUPLICATE KEY UPDATE 
                 event_state_id = VALUES(event_state_id)`,
			[eventId, state, getUTCDatetime(), getUTCDatetime()]
		);

		res.isStateUpdated = true;
		res.result = result;
	}

	return res;
}