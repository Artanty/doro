import { BASE_SCHEDULE_ID } from "../../core/constants";
import { GetLastPositionResult, getLastSchedulePosition } from "../../db-actions/get-last-schedule-position";
import { DbActionResult } from "../../types/db-action.types";

export interface ScheduleInfo {
	schedule_id: number, 
	schedule_position: number
}
export const buildScheduleInfo = async (
	connection, schedule_id?: number,
	schedule_position?: number
): Promise<ScheduleInfo> => {

	if (!schedule_id) {
		schedule_id = BASE_SCHEDULE_ID;
	}
	const lastPositionResult: DbActionResult<GetLastPositionResult> = await getLastSchedulePosition(connection, schedule_id);
	
	if (!lastPositionResult.success) throw new Error('buildScheduleInfo error');

	return {
		schedule_id,
		schedule_position: lastPositionResult.result!.last_position + 1
	}
}