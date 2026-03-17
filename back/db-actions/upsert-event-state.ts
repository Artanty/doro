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
	eventId: any, state: any
}
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
		// Get all current states in one query
		const eventIds = eventStates.map(es => es.eventId);
		const placeholders = eventIds.map(() => '?').join(',');
		
		const [currentStates] = await connection.execute(
			`SELECT eventId, event_state_id FROM eventState 
			 WHERE eventId IN (${placeholders})`,
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
				
				// Initialize result entry (will be updated after bulk insert)
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

		// Bulk insert/update only the states that changed
		if (statesToUpdate.length > 0) {
			// Build bulk insert query
			const values: any[] = [];
			const valuePlaceholders = statesToUpdate.map(es => {
				values.push(es.eventId, es.state, getUTCDatetime(), getUTCDatetime());
				return '(?, ?, ?, ?)';
			}).join(',');

			const [bulkResult] = await connection.execute(
				`INSERT INTO eventState (eventId, event_state_id, created_at, updated_at) 
				 VALUES ${valuePlaceholders}
				 ON DUPLICATE KEY UPDATE 
					 event_state_id = VALUES(event_state_id),
					 updated_at = VALUES(updated_at)`,
				values
			);

			// Update results with the bulk operation outcome
			for (const es of statesToUpdate) {
				const existingResult = result.results.get(es.eventId);
				if (existingResult) {
					existingResult.result = bulkResult;
					
					// You can add more specific debug info if needed
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