import { dd } from "../utils/dd";
import { getUTCDatetime } from "../utils/get-utc-datetime";
import { Nullable } from "../utils/utility.types";

export interface DbActionResult<T = any> {
	success: boolean;
	result: Nullable<T>;
	error: null | string;
}

export interface BulkCreateEventItem {
	name: string;
	length: number;
	type: number;
	schedule_id: number;
	schedule_position: number;
	base_access?: number;
	created_from?: string;
	event_state_id?: number;
}

export interface BulkCreateEventResult {
	success: boolean;
	results: Map<string, { insertId: number | null; error?: string }>;
	debug?: any;
}

export const bulkCreateEvents = async (
	connection: any,
	userHandler: string,
	events: BulkCreateEventItem[]
): Promise<BulkCreateEventResult> => {
	
	const result = {
		success: true,
		results: new Map<string, { insertId: number | null; error?: string }>(),
		debug: {}
	};

	if (!events || events.length === 0) {
		return result;
	}

	try {
		// Get all schedules that are trying to create active events
		const activeCreations = events.filter(e => e.event_state_id === 1);
		
		if (activeCreations.length > 0) {
			// Group by schedule_id
			const scheduleToEventsMap = new Map<number, BulkCreateEventItem[]>();
			
			for (const event of activeCreations) {
				if (!scheduleToEventsMap.has(event.schedule_id)) {
					scheduleToEventsMap.set(event.schedule_id, []);
				}
				scheduleToEventsMap.get(event.schedule_id)!.push(event);
			}
			
			// Get all schedules we're checking
			const schedulesToCheck = Array.from(scheduleToEventsMap.keys());
			const schedulePlaceholders = schedulesToCheck.map(() => '?').join(',');
			
			// Find existing active events in these schedules
			const [activeEvents] = await connection.execute(
				`SELECT id, schedule_id FROM events 
				 WHERE schedule_id IN (${schedulePlaceholders}) 
				 AND event_state_id = 1`,
				schedulesToCheck
			);
			
			// Create map of schedule_id -> active event id
			const activeScheduleMap = new Map();
			activeEvents.forEach((row: any) => {
				activeScheduleMap.set(row.schedule_id, row.id);
			});
			
			// Validate each schedule
			for (const [scheduleId, eventsToCreate] of scheduleToEventsMap) {
				const existingActiveEventId = activeScheduleMap.get(scheduleId);
				
				if (existingActiveEventId) {
					// Schedule already has active event
					for (const event of eventsToCreate) {
						result.results.set(`schedule_${scheduleId}_${event.schedule_position}`, {
							insertId: null,
							error: `Cannot create active event. Schedule ${scheduleId} already has active event ${existingActiveEventId}`
						});
					}
					result.success = false;
				} else if (eventsToCreate.length > 1) {
					// Multiple active creations in same schedule
					for (const event of eventsToCreate) {
						result.results.set(`schedule_${scheduleId}_${event.schedule_position}`, {
							insertId: null,
							error: `Cannot create multiple active events in schedule ${scheduleId}. Only one active event allowed per schedule.`
						});
					}
					result.success = false;
				} else {
					// Valid creation - will proceed
					// Mark as pending
					result.results.set(`schedule_${scheduleId}_${eventsToCreate[0].schedule_position}`, {
						insertId: null
					});
				}
			}
		}

		// Filter events that passed validation
		const validEvents = events.filter(event => {
			const key = `schedule_${event.schedule_id}_${event.schedule_position}`;
			const existingResult = result.results.get(key);
			return !existingResult?.error;
		});

		// Bulk insert valid events
		if (validEvents.length > 0) {
			const values: any[] = [];
			const valuePlaceholders = validEvents.map(event => {
				values.push(
					event.name,
					event.length,
					event.type,
					getUTCDatetime(),
					userHandler,
					event.base_access || 0,
					event.created_from || '',
					event.schedule_id,
					event.schedule_position,
					event.event_state_id || 0
				);
				return '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
			}).join(',');

			const [bulkResult] = await connection.execute(
				`INSERT INTO events (name, length, type, created_at, created_by, base_access_id, created_from, schedule_id, schedule_position, event_state_id) 
				 VALUES ${valuePlaceholders}`,
				values
			);

			// Update results with insert IDs
			const startInsertId = bulkResult.insertId;
			validEvents.forEach((event, index) => {
				const key = `schedule_${event.schedule_id}_${event.schedule_position}`;
				const insertId = startInsertId ? startInsertId + index : null;
				result.results.set(key, { insertId });
			});
		}

		result.debug = {
			totalEvents: events.length,
			validEvents: validEvents.length,
			failedEvents: events.length - validEvents.length,
			insertedIds: result.results.size
		};

		return result;

	} catch (error: any) {
		return {
			success: false,
			results: new Map(),
			debug: {
				error: error.message,
				stack: error.stack
			}
		};
	}
}

// Keep the original single create function
export const createEvent = async (
	connection: any, 
	name: string,
	length: number,
	type: number,
	userHandler: string,
	schedule_id: number,
	schedule_position: number,
	
	base_access: number = 0,
	created_from: string = '',
	event_state_id: number = 0
): Promise<DbActionResult> => {

	const res: any = {
		success: false,
		result: null,
		error: null
	}
	
	try {
		// If creating an active event (event_state_id = 1), check for existing active event
		if (event_state_id === 1) {
			const [activeEvents] = await connection.execute(
				`SELECT id FROM events 
				 WHERE schedule_id = ? 
				 AND event_state_id = 1 
				 LIMIT 1`,
				[schedule_id]
			);
			
			if (activeEvents.length > 0) {
				res.error = `Cannot create active event. Schedule ${schedule_id} already has active event ${activeEvents[0].id}`;
				return res;
			}
		}
		
		const [eventResult] = await connection.execute(
			'INSERT INTO events (name, length, type, created_at, created_by, base_access_id, created_from, schedule_id, schedule_position, event_state_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
			[name, length, type, getUTCDatetime(), userHandler, base_access, created_from, schedule_id, schedule_position, event_state_id]
		);
                
		res.success = true;
		res.result = eventResult.insertId;

		return res;
	} catch (error: any) {
		dd(error.message)
		res.error = error.message

		return res;
	}
}