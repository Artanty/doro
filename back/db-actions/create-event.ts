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
		for (const event of events) {
			const key = `schedule_${event.schedule_id}_${event.schedule_position}`;
			result.results.set(key, { insertId: null });
		}

		// Bulk insert all events
		const values: any[] = [];
		const valuePlaceholders = events.map(event => {
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
		events.forEach((event, index) => {
			const key = `schedule_${event.schedule_id}_${event.schedule_position}`;
			const insertId = startInsertId ? startInsertId + index : null;
			result.results.set(key, { insertId });
		});

		result.debug = {
			totalEvents: events.length,
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