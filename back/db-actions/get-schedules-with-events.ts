import { dd } from "../utils/dd";
import { DbActionResult } from "./create-event";
import { getDefaultEventStateHook } from "./get-default-event-state-hook";

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
	
	try {
		// Get schedule with events and their hooks in a single query
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
        e.updated_at as event_updated_at,
        
        es.event_state_id as event_current_state,
        
        h.id as hook_id,
        h.trigger_event_state_id as hook_trigger_state,
        h.action_type as hook_action_type,
        h.action_config as hook_action_config,
        h.created_at as hook_created_at,
        h.updated_at as hook_updated_at
        
      FROM schedules s
      LEFT JOIN events e ON s.id = e.schedule_id
      LEFT JOIN eventState es ON e.id = es.eventId
      LEFT JOIN eventStateHooks h ON e.id = h.event_id
      WHERE s.id = ? AND s.created_by = ?
      ORDER BY e.schedule_position ASC, h.trigger_event_state_id ASC
    `, [scheduleId, userHandler]);
		
		// If no schedule found
		if (queryResult.length === 0) {
			res.success = true;
			res.result = null;
			return res;
		}

		// Build schedule object
		const schedule: any = {
			id: queryResult[0].schedule_id,
			name: queryResult[0].schedule_name,
			created_by: queryResult[0].schedule_created_by,
			created_at: queryResult[0].schedule_created_at,
			updated_at: queryResult[0].schedule_updated_at,
			events: []
		};

		// Process results to group events and their hooks
		const eventsMap = new Map();
		
		for (const row of queryResult) {
			if (!row.event_id) continue; // Skip if no event
			
			// Get or create event
			if (!eventsMap.has(row.event_id)) {
				eventsMap.set(row.event_id, {
					id: row.event_id,
					name: row.event_name,
					length: row.event_length,
					type: row.event_type,
					schedule_id: row.event_schedule_id,
					schedule_position: row.event_position,
					created_by: row.event_created_by,
					created_at: row.event_created_at,
					updated_at: row.event_updated_at,
					current_state: row.event_current_state,
					eventStateHook: []
				});
			}
			
			// Add hook if exists
			if (row.hook_id) {
				const event = eventsMap.get(row.event_id);
				event.eventStateHook.push({
					id: row.hook_id,
					trigger_event_state_id: row.hook_trigger_state,
					action_type: row.hook_action_type,
					action_config: typeof row.hook_action_config === 'string' 
						? JSON.parse(row.hook_action_config) 
						: row.hook_action_config,
					created_at: row.hook_created_at,
					updated_at: row.hook_updated_at
				});
			} else {
				const event = eventsMap.get(row.event_id);
				event.eventStateHook = [getDefaultEventStateHook(row.event_id)];
			}
		}
		
		// Convert events map to array and sort by position
		schedule.events = Array.from(eventsMap.values())
			.sort((a, b) => a.schedule_position - b.schedule_position);
    
		res.success = true;
		res.result = schedule;
    
		return res;
	} catch (error: any) {
		res.error = error.message;
		return res;
	}
}