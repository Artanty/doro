import { dd } from "../utils/dd";
import { getUTCDatetime } from "../utils/get-utc-datetime";
import { Nullable } from "../utils/utility.types";

export interface DbActionResult<T = any> {
	success: boolean;
	result: Nullable<T>;
	error: null | string;
}

export interface BulkCreateEventItem {
	name: string,
	length: number,
	playhead: number,
	is_rest: boolean,
	schedule_id: number,
	schedule_position: number,
}

export interface BulkCreateEventResult {
	success: boolean;
	results: Map<string, { insertId: number | null; error?: string }>;
	debug?: any;
}

/**
 * 
 * @deprecated not tested, old props in sql statement 
 */
export const bulkCreateEventsDb = async (
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
				event.playhead,
				event.is_rest,
				
				event.schedule_id,
				event.schedule_position,

				
				userHandler,
			);
			return '(?, ?, ?, ?, ?, ?, ?, ?)';
		}).join(',');

		const [bulkResult] = await connection.execute(
			`INSERT INTO events (name, length, playhead, is_rest, schedule_id, schedule_position, is_public, created_by) 
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

export const createEventDb = async (
	connection: any, 
	name: string,
	length: number,
	playhead: number,
	is_rest: boolean,
	schedule_id: number,
	schedule_position: number,
	updated_at?: string
): Promise<DbActionResult> => {

	const res: any = {
		success: false,
		result: null,
		error: null
	}
	
	try {
		
		const currentDatetime = updated_at ?? getUTCDatetime();
		
		const [eventResult] = await connection.execute(
			'INSERT INTO events (name, length, playhead, is_rest, schedule_id, schedule_position, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
			[name, length, playhead, is_rest, schedule_id, schedule_position, currentDatetime]
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