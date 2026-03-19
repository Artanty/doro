import { eventProgress } from "../core/constants";

export interface GetEventStateHooksParams {
	eventId: number;
	trigger_state?: eventProgress; // Optional filter by state
	action_type?: string; // Optional filter by action type
}

export interface EventStateHook {
	id: number;
	event_id: number;
	trigger_event_state_id: eventProgress;
	action_type: string;
	action_config: Record<string, any>;
	created_at: string;
	updated_at: string;
}

export interface GetEventStateHooksRes {
	success: boolean;
	hooks: EventStateHook[];
	count: number;
	error?: string;
	debug?: any;
}

export const getEventStateHooks = async (
	connection: any,
	params: GetEventStateHooksParams
): Promise<GetEventStateHooksRes> => {
	
	const res: GetEventStateHooksRes = {
		success: false,
		hooks: [],
		count: 0,
		debug: {
			params
		}
	};
	
	try {
		// Validate required fields
		if (!params.eventId) {
			throw new Error('eventId is required');
		}
		// debugger;
		// Build query with optional filters
		let query = `
			SELECT 
				id,
				event_id,
				trigger_event_state_id,
				action_type,
				action_config,
				created_at,
				updated_at
			FROM eventStateHooks 
			WHERE event_id = ?
		`;
		
		const queryParams: any[] = [params.eventId];
		
		// Add optional trigger_state filter
		if (params.trigger_state !== undefined && params.trigger_state !== null) {
			query += ` AND trigger_event_state_id = ?`;
			queryParams.push(params.trigger_state);
		}
		
		// Add optional action_type filter
		if (params.action_type) {
			query += ` AND action_type = ?`;
			queryParams.push(params.action_type);
		}
		
		// Order by trigger_state and id for consistency
		query += ` ORDER BY trigger_event_state_id ASC, id ASC`;
		
		// Execute query
		const [rows] = await connection.execute(query, queryParams);
		
		// Parse JSON action_config for each hook
		const hooks: EventStateHook[] = rows.map((row: any) => ({
			id: row.id,
			event_id: row.event_id,
			trigger_event_state_id: row.trigger_event_state_id,
			action_type: row.action_type,
			action_config: typeof row.action_config === 'string' 
				? JSON.parse(row.action_config) 
				: row.action_config,
			created_at: row.created_at,
			updated_at: row.updated_at
		}));
		
		res.success = true;
		res.hooks = hooks;
		res.count = hooks.length;
		res.debug = {
			...res.debug,
			query: {
				sql: query,
				params: queryParams
			},
			foundCount: hooks.length
		};
		
	} catch (error: any) {
		res.success = false;
		res.error = error.message;
		res.debug = {
			...res.debug,
			error: error.message,
			stack: error.stack
		};
		console.error('Error getting event state hooks:', error);
	}
	
	return res;
};

// Convenience function to get hooks by state
export const getEventStateHooksByState = async (
	connection: any,
	eventId: number,
	trigger_state: eventProgress
): Promise<GetEventStateHooksRes> => {
	return getEventStateHooks(connection, {
		eventId,
		trigger_state
	});
};

// Convenience function to get hooks by action type
export const getEventStateHooksByActionType = async (
	connection: any,
	eventId: number,
	action_type: string
): Promise<GetEventStateHooksRes> => {
	return getEventStateHooks(connection, {
		eventId,
		action_type
	});
};