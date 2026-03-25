import { DbActionResult } from "../types/db-action.types";
import { MinimalEventProps } from "../types/event-state.types";

export interface GetEventStateResult {
	id: number;
	name: string;
	length: number;
	type: number;
	base_access_id: number;
	schedule_id: number;
	schedule_position: number;
	created_by: string;
	created_at: Date;
	updated_at: Date;
	created_from: string;
	event_state_id: number;
}
export const getEventState = async (
	connection, 
	event: MinimalEventProps,
): Promise<DbActionResult<GetEventStateResult>> => {
	
	const res: DbActionResult<GetEventStateResult> = {
		success: false,
		result: null,
		error: null
	}
	
	try {

		const [queryResult] = await connection.execute(
			`SELECT * FROM events WHERE id = ?`,
			[event.id]
		);

		if (!queryResult?.[0]) {
			throw new Error('no event state')
		}

		res.result = queryResult[0];     
		res.success = true;
		
		return res;
	} catch (error: any) {
		res.error = error.message
		
		return res;
	}
}