import { dd } from "../utils/dd";
import { DbActionResult } from "./create-event";

export const getScheduleWithEvents = async (
	connection, 
	userHandler: string,
	scheduleId: number
): Promise<DbActionResult> => {
	const res = {
		success: false,
		result: null,
		error: null
	}
	dd(scheduleId)
	try {
		const [queryResult] = await connection.execute(`
      SELECT 
      s.id as schedule_id,
      s.name as schedule_name,
      s.created_by as schedule_created_by,
      s.created_at as schedule_created_at,
      s.updated_at as schedule_updated_at,
      e.id as event_id,
      e.name as event_name,
      e.length as event_length,
      e.type as event_type,
      e.schedule_id as event_schedule_id,
      e.schedule_position as event_position,
      e.created_by as event_created_by,
      e.created_at as event_created_at,
      e.updated_at as event_updated_at
    FROM schedules s
    LEFT JOIN events e ON s.id = e.schedule_id
    WHERE s.id = ? AND s.created_by = ?
    ORDER BY e.schedule_position ASC
    `, [scheduleId, userHandler]);
		
		dd(queryResult)
		// If no schedule found
		if (queryResult.length === 0) {
			res.success = true;
			res.result = null; // Or empty object
			return res;
		}

		// Build schedule object from first row
		const firstRow = queryResult[0];
		const schedule: any = {
			id: firstRow.schedule_id,
			name: firstRow.schedule_name,
			created_by: firstRow.schedule_created_by,
			created_at: firstRow.schedule_created_at,
			updated_at: firstRow.schedule_updated_at,
			events: []
		};

		// Add events (skip if event_id is null - LEFT JOIN returns null for schedules without events)
		for (const row of queryResult) {
			if (row.event_id) {
				schedule.events.push({
					id: row.event_id,
					name: row.event_name,
					length: row.event_length,
					type: row.event_type,
					base_access: row.event_base_access,
					schedule_id: row.event_schedule_id,
					schedule_position: row.event_position,
					created_by: row.event_created_by,
					created_at: row.event_created_at,
					updated_at: row.event_updated_at
				});
			}
		}
    
		res.success = true;
		res.result = schedule;
    
		return res;
	} catch (error: any) {
		dd(error.message)
		res.error = error.message
    
		return res;
	}
}