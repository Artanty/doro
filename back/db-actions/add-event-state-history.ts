import { dd } from "../utils/dd";
import { getUTCDatetime } from "../utils/get-utc-datetime";

interface AddEventStateHistoryResult {
	success: boolean;
	result: null | number;
	error: null | string;
}

interface BulkAddEventStateHistoryResult {
	success: boolean;
	results: Map<string, { insertId: number | null, success: boolean, error?: string }>;
	insertIds: number[];
	error: null | string;
	debug?: any;
}

export const bulkAddEventStateHistory = async (
	connection: any, 
	eventStates: Array<{ eventId: any, state: any }>
): Promise<BulkAddEventStateHistoryResult> => {
	
	const result = {
		success: true,
		results: new Map<string, { insertId: number | null, success: boolean, error?: string }>(),
		insertIds: [] as number[],
		error: null as string | null,
		debug: {}
	};

	if (!eventStates || eventStates.length === 0) {
		return result;
	}

	try {
		// Build bulk insert query
		const values: any[] = [];
		const valuePlaceholders = eventStates.map(es => {
			values.push(es.eventId, es.state, getUTCDatetime());
			return '(?, ?, ?)';
		}).join(',');
		
		const [bulkResult] = await connection.execute(
			`INSERT INTO eventStateHistory (eventId, event_state_id, created_at) 
			 VALUES ${valuePlaceholders}`,
			values
		);

		// MySQL bulk insert returns information about the operation
		// For mysql2, bulkResult.insertId is the ID of the first inserted row
		// Subsequent rows get sequential IDs
		
		const startInsertId = bulkResult.insertId;
		
		// Map results to each event
		eventStates.forEach((es, index) => {
			const insertId = startInsertId ? startInsertId + index : null;
			result.results.set(es.eventId, {
				insertId: insertId,
				success: true
			});
			if (insertId) {
				result.insertIds.push(insertId);
			}
		});

		result.debug = {
			affectedRows: bulkResult.affectedRows,
			startInsertId: startInsertId,
			eventsCount: eventStates.length,
			insertIds: result.insertIds
		};

		return result;

	} catch (error: any) {
		return {
			success: false,
			results: new Map(),
			insertIds: [],
			error: error.message,
			debug: {
				error: error.message,
				stack: error.stack
			}
		};
	}
}

// Keep the original function for backward compatibility
export const addEventStateHistory = async (
	connection: any, 
	eventId: any, 
	state: any, 
): Promise<AddEventStateHistoryResult> => {

	const bulkResult = await bulkAddEventStateHistory(connection, [{ eventId, state }]);
	
	if (bulkResult.success && bulkResult.results.has(eventId)) {
		const eventResult = bulkResult.results.get(eventId);
		return {
			success: true,
			result: eventResult?.insertId || null,
			error: null
		};
	} else {
		return {
			success: false,
			result: null,
			error: bulkResult.error || 'Unknown error occurred'
		};
	}
}

// Optional: Advanced version with batch processing for very large datasets
export const bulkAddEventStateHistoryBatched = async (
	connection: any, 
	eventStates: Array<{ eventId: any, state: any }>,
	batchSize: number = 100
): Promise<BulkAddEventStateHistoryResult> => {
	
	const finalResult: BulkAddEventStateHistoryResult = {
		success: true,
		results: new Map(),
		insertIds: [],
		error: null,
		debug: {
			batches: 0,
			batchSize: batchSize,
			totalEvents: eventStates.length
		}
	};

	if (!eventStates || eventStates.length === 0) {
		return finalResult;
	}

	try {
		// Process in batches to avoid too large queries
		for (let i = 0; i < eventStates.length; i += batchSize) {
			const batch = eventStates.slice(i, i + batchSize);
			const batchResult = await bulkAddEventStateHistory(connection, batch);
			
			// Merge results
			batchResult.results.forEach((value, key) => {
				finalResult.results.set(key, value);
			});
			finalResult.insertIds.push(...batchResult.insertIds);
			
			// Update debug info
			finalResult.debug.batches = (finalResult.debug.batches as number) + 1;
			
			// If any batch fails, mark overall as failed but continue processing
			if (!batchResult.success) {
				finalResult.success = false;
				finalResult.error = finalResult.error || 'Some batches failed';
			}
		}

		finalResult.debug.finalInsertIds = finalResult.insertIds;
		
		return finalResult;

	} catch (error: any) {
		return {
			success: false,
			results: new Map(),
			insertIds: [],
			error: error.message,
			debug: {
				error: error.message,
				stack: error.stack,
				processedEvents: finalResult.results.size
			}
		};
	}
};