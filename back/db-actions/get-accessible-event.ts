import { EventPropsDbItem } from "../types/event.types";
import { dd } from "../utils/dd";
import { ensureArray } from "../utils/ensureArray";
import { getUTCDatetime } from "../utils/get-utc-datetime";

export const ACCESS_CASE = {
	DELETE: 3,
	UPDATE: 2
}

interface DbActionResult {
	success: boolean;
	result: EventPropsDbItem | null;
	error: null | string;
	debug?: any
}

interface BulkDbActionResult {
	success: boolean;
	results: Map<string, EventPropsDbItem | null>; // eventId -> event data
	errors: any; // eventId -> error message
	debug?: any
}

/**
 * Check access for multiple events in bulk
 * Returns a Map with eventId as key and event data (or null if no access) as value
 */
export const getAccessibleEvents = async (
	connection: any, 
	eventIds: string | string[], 
	userHandler: string,
	accessLevel: number = 1
): Promise<BulkDbActionResult> => {
	eventIds = ensureArray(eventIds);
	const result = {
		success: true,
		results: new Map<string, EventPropsDbItem | null>(),
		errors: new Map<string, string>(),
		debug: {}
	};

	if (!eventIds || eventIds.length === 0) {
		return result;
	}
	// debugger;
	try {
		// Create placeholders for the IN clause
		const placeholders = eventIds.map(() => '?').join(',');
		// debugger;
		// Get all events in one query
		const [events] = await connection.execute(
			`SELECT * FROM events WHERE id IN (${placeholders})`,
			eventIds
		);

		// Create a map of eventId to event for easy lookup
		const eventsMap = new Map<string, EventPropsDbItem>(
			events.map((event: any) => [event.id, event])
		);

		// Find which events the user has direct access to (owner or public access)
		const directlyAccessibleEventIds: string[] = [];
		const eventsNeedingSharedCheck: string[] = [];

		for (const eventId of eventIds) {
			const event = eventsMap.get(eventId);
			
			if (!event) {
				// Event doesn't exist
				result.errors.set(eventId, 'Event not found');
				result.results.set(eventId, null);
				continue;
			}

			// Check if user is owner
			if (event.created_by === userHandler) {
				directlyAccessibleEventIds.push(eventId);
				result.results.set(eventId, event);
				continue;
			}

			// Check public access
			if (event.base_access_id >= accessLevel) {
				directlyAccessibleEventIds.push(eventId);
				result.results.set(eventId, event);
				continue;
			}

			// Need to check shared access
			eventsNeedingSharedCheck.push(eventId);
		}

		// If there are events that need shared access check
		if (eventsNeedingSharedCheck.length > 0) {
			const sharedPlaceholders = eventsNeedingSharedCheck.map(() => '?').join(',');
			
			// Get all shared access records for these events in one query
			const [sharedAccessResults] = await connection.execute(
				`SELECT * FROM eventToUser 
				 WHERE event_id IN (${sharedPlaceholders}) 
				 AND user_handler = ?
				 AND access_level_id >= ?`,
				[...eventsNeedingSharedCheck, userHandler, accessLevel]
			);

			// Create a set of eventIds that have shared access
			const accessibleViaShared = new Set(
				sharedAccessResults.map((row: any) => row.event_id)
			);

			// Check each event that needed shared access
			for (const eventId of eventsNeedingSharedCheck) {
				if (accessibleViaShared.has(eventId)) {
					// User has shared access
					result.results.set(eventId, eventsMap.get(eventId)!);
				} else {
					// No access found
					result.errors.set(eventId, 'No appropriate access to this event found');
					result.results.set(eventId, null);
				}
			}
		}

		// Set debug info
		result.debug = {
			totalEvents: eventIds.length,
			foundEvents: events.length,
			directlyAccessible: directlyAccessibleEventIds.length,
			needingSharedCheck: eventsNeedingSharedCheck.length,
			accessibleViaShared: result.results.size - directlyAccessibleEventIds.length,
			errors: result.errors.size
		};
		if (result.errors.size) {
			result.success = false;
		}
		result.errors = result.errors;
		return result;
	} catch (error: any) {
		return {
			success: false,
			results: new Map(),
			errors: new Map(eventIds.map(id => [id, error.message])),
			debug: { error: error.message }
		};
	}
}

// Keep the original function for backward compatibility if needed
export const getAccessibleEvent = async (
	connection: any, 
	eventId: any, 
	userHandler: string,
	accessLevel: number = 1
): Promise<DbActionResult> => {
	const result = await getAccessibleEvents(
		connection, 
		[eventId], 
		userHandler, 
		accessLevel
	);
	
	const eventData = result.results.get(eventId);
	
	return {
		success: result.success && !!eventData,
		result: eventData || null,
		error: result.errors.get(eventId) || null,
		debug: result.debug
	};
}