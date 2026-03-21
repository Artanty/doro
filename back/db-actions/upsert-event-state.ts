import { getUTCDatetime } from "../utils/get-utc-datetime";

export interface UpsertEventStateActionRes {
	success: boolean,
	result: any,
	error?: string;
	debug?: any;
}

export interface BulkUpsertEventStateActionRes {
	results: Map<string, UpsertEventStateActionRes>; // eventId -> result
	success: boolean;
	error?: string;
	debug?: any;
}

export interface UpsertEventStateItem {
	eventId: any, 
	state: any
}

// Updated for merged table (state columns now in events table)
export const bulkUpsertEventState = async (
	connection: any, 
	eventStates: UpsertEventStateItem[]
): Promise<BulkUpsertEventStateActionRes> => {
	
	const result = {
		results: new Map<string, UpsertEventStateActionRes>(),
		success: true,
		debug: {}
	};

	if (!eventStates || eventStates.length === 0) {
		return result;
	}
	try {
		// Get all current states and schedule_ids from events table
		const eventIds = eventStates.map(es => es.eventId);
		const placeholders = eventIds.map(() => '?').join(',');
		
		const [currentEvents] = await connection.execute(
			`SELECT id as eventId, event_state_id, schedule_id FROM events 
			 WHERE id IN (${placeholders})`,
			eventIds
		);

		// Create maps for quick lookup
		const currentStateMap = new Map();
		const scheduleMap = new Map();
		currentEvents.forEach((row: any) => {
			currentStateMap.set(row.eventId, row.event_state_id);
			scheduleMap.set(row.eventId, row.schedule_id);
		});

		// Check for missing events
		for (const es of eventStates) {
			if (!currentStateMap.has(es.eventId)) {				
				result.results.set(es.eventId, {
					success: false,
					result: null,
					error: `Event ${es.eventId} not found`,
					debug: {}
				});
				result.success = false;
			}
		}

		// Filter out invalid events
		const validEventStates = eventStates.filter(es => currentStateMap.has(es.eventId));
		
		if (validEventStates.length === 0) {
			result.debug = { totalEvents: eventStates.length, allInvalid: true };
			return result;
		}

		// Check for events that are trying to become active (state = 1)
		const eventsToActivate = validEventStates.filter(es => es.state === 1);
		
		if (eventsToActivate.length > 0) {
			// Group events to activate by schedule
			const scheduleToEventsMap = new Map<number, Array<{ eventId: any, state: any }>>();
			
			for (const es of eventsToActivate) {
				const scheduleId = scheduleMap.get(es.eventId);
				if (!scheduleToEventsMap.has(scheduleId)) {
					scheduleToEventsMap.set(scheduleId, []);
				}
				scheduleToEventsMap.get(scheduleId)!.push(es);
			}
			
			// Get all schedules we're checking
			const schedulesToCheck = Array.from(scheduleToEventsMap.keys());
			const schedulePlaceholders = schedulesToCheck.map(() => '?').join(',');
			
			// Find any existing active events in these schedules
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
			
			// Validate each activation
			for (const [scheduleId, eventsToActivateInSchedule] of scheduleToEventsMap) {
				const existingActiveEventId = activeScheduleMap.get(scheduleId);
				
				// Case 1: There's already an active event in this schedule
				if (existingActiveEventId) {
					// Mark all events trying to activate in this schedule as failed
					for (const es of eventsToActivateInSchedule) {
						result.results.set(es.eventId, {
							success: false,
							result: null,
							error: `Cannot activate event ${es.eventId}. Schedule ${scheduleId} already has active event ${existingActiveEventId}`,
							debug: {
								scheduleId,
								existingActiveEventId,
								attemptedState: es.state,
								currentState: currentStateMap.get(es.eventId)
							}
						});
						result.success = false;
					}
				} 
				// Case 2: No active event in this schedule, but multiple events trying to activate
				else if (eventsToActivateInSchedule.length > 1) {
					// Mark all but one as failed, or mark all as failed? 
					// Let's mark all as failed and let the caller handle it
					for (const es of eventsToActivateInSchedule) {
						result.results.set(es.eventId, {
							success: false,
							result: null,
							error: `Cannot activate multiple events in schedule ${scheduleId} at once. Only one event can be active per schedule.`,
							debug: {
								scheduleId,
								conflictingEvents: eventsToActivateInSchedule.map(e => e.eventId),
								attemptedState: es.state,
								currentState: currentStateMap.get(es.eventId)
							}
						});
						result.success = false;
					}
				}
				// Case 3: Valid activation - single event with no existing active event
				else {
					// Mark this activation as valid - it will be updated later
					const es = eventsToActivateInSchedule[0];
					// We'll process it in statesToUpdate
				}
			}
		}

		// Separate states that need updating from those that don't
		const statesToUpdate: Array<{ eventId: any, state: any }> = [];
		
		for (const es of validEventStates) {
			// Skip if already failed validation
			if (result.results.has(es.eventId)) {
				continue;
			}
			
			const currentState = currentStateMap.get(es.eventId) || null;
			
			if (currentState === es.state) {
				// State hasn't changed
				result.results.set(es.eventId, {
					success: false,
					result: null,
					debug: {
						currentState,
						newState: es.state,
						reason: 'State unchanged'
					}
				});
			} else {
				// State needs update
				statesToUpdate.push(es);
				
				// Initialize result entry (will be updated after bulk update)
				result.results.set(es.eventId, {
					success: true,
					result: null,
					debug: {
						currentState,
						newState: es.state,
						reason: 'Pending update'
					}
				});
			}
		}

		// Bulk update only the states that changed
		if (statesToUpdate.length > 0) {
			// Build CASE statements for bulk update
			const updateQueries: string[] = [];
			const updateValues: any[] = [];
			
			for (const es of statesToUpdate) {
				updateQueries.push(`WHEN ? THEN ?`);
				updateValues.push(es.eventId, es.state);
			}
			
			const currentTime = getUTCDatetime();
			
			const [bulkResult] = await connection.execute(
				`UPDATE events 
				 SET event_state_id = CASE id ${updateQueries.join(' ')} END,
					 updated_at = ?
				 WHERE id IN (${statesToUpdate.map(() => '?').join(',')})`,
				[...updateValues, currentTime, ...statesToUpdate.map(es => es.eventId)]
			);

			// Update results with the bulk operation outcome
			for (const es of statesToUpdate) {
				const existingResult = result.results.get(es.eventId);
				if (existingResult) {
					existingResult.result = {
						affectedRows: bulkResult.affectedRows,
						changedRows: bulkResult.changedRows
					};
					
					existingResult.debug = {
						...existingResult.debug,
						bulkOperationAffectedRows: bulkResult.affectedRows,
						bulkOperationChangedRows: bulkResult.changedRows
					};
				}
			}
		}

		// Check if any updates failed
		const hasFailures = Array.from(result.results.values()).some(r => !r.success && r.error);
		if (hasFailures) {
			result.success = false;
		}

		// Add debug info
		const totalFailed = Array.from(result.results.values()).filter(r => !r.success && r.error).length;
		const totalSuccess = Array.from(result.results.values()).filter(r => r.success).length;
		
		result.debug = {
			totalEvents: eventStates.length,
			unchangedStates: Array.from(result.results.values()).filter(r => !r.success && !r.error).length,
			updatedStates: totalSuccess,
			failedValidations: totalFailed,
			bulkOperationPerformed: statesToUpdate.length > 0
		};

		return result;

	} catch (error: any) {
		return {
			results: new Map(),
			success: false,
			error: error.message,
			debug: {
				error: error.message,
				stack: error.stack
			}
		};
	}
}

// Keep the original function for backward compatibility
export const upsertEventState = async (
	connection: any, 
	eventId: any, 
	state: any,
): Promise<UpsertEventStateActionRes> => {
	
	const bulkResult = await bulkUpsertEventState(connection, [{ eventId, state }]);
	
	const singleResult = bulkResult.results.get(eventId);
	
	return {
		success: singleResult?.success || false,
		result: singleResult?.result || null,
		error: singleResult?.error || bulkResult.error,
		debug: {
			...singleResult?.debug,
			bulkDebug: bulkResult.debug
		}
	};
}