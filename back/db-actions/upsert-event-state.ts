import { getUTCDatetime } from "../utils/get-utc-datetime";

export interface UpsertEventStateActionRes {
	isStateUpdated: boolean,
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
		// Get all current states from events table (not eventState)
		const eventIds = eventStates.map(es => es.eventId);
		const placeholders = eventIds.map(() => '?').join(',');
		
		const [currentStates] = await connection.execute(
			`SELECT id as eventId, event_state_id FROM events 
			 WHERE id IN (${placeholders})`,
			eventIds
		);

		// Create a map of current states for quick lookup
		const currentStateMap = new Map();
		currentStates.forEach((row: any) => {
			currentStateMap.set(row.eventId, row.event_state_id);
		});

		// Separate states that need updating from those that don't
		const statesToUpdate: Array<{ eventId: any, state: any }> = [];
		
		for (const es of eventStates) {
			const currentState = currentStateMap.get(es.eventId) || null;
			
			if (currentState === es.state) {
				// State hasn't changed
				result.results.set(es.eventId, {
					isStateUpdated: false,
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
					isStateUpdated: true,
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
			
			const caseStatement = updateQueries.join(' ');
			const currentTime = getUTCDatetime();
			
			const [bulkResult] = await connection.execute(
				`UPDATE events 
				 SET event_state_id = CASE id ${caseStatement} END,
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

		// Add debug info
		result.debug = {
			totalEvents: eventStates.length,
			unchangedStates: eventStates.length - statesToUpdate.length,
			updatedStates: statesToUpdate.length,
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
		isStateUpdated: singleResult?.isStateUpdated || false,
		result: singleResult?.result || null,
		error: bulkResult.error,
		debug: {
			...singleResult?.debug,
			bulkDebug: bulkResult.debug
		}
	};
}