import { eventProgress } from "../core/constants";
import { getUTCDatetime } from "../utils/get-utc-datetime";

export interface CreateEventStateHookParams {
	trigger_event_state_id: eventProgress;
	action_type: string;
	action_config: Record<string, any>;
}

export interface CreateEventStateHooksRes {
	success: boolean;
	results: {
		hookId: number;
		params: CreateEventStateHookParams;
	}[];
	errors?: {
		index: number;
		params: CreateEventStateHookParams;
		error: string;
	}[];
	debug?: any;
}

export const createEventStateHooks = async (
	connection: any,
	eventId: number,
	hooks: CreateEventStateHookParams[]
): Promise<CreateEventStateHooksRes> => {
	
	const res: CreateEventStateHooksRes = {
		success: false,
		results: [],
		errors: [],
		debug: {
			eventId,
			totalHooks: hooks?.length ?? 0,
			validationResults: {},
			executionResults: {}
		}
	};

	if (!hooks?.length) {
		return res;
	}

	try {
		const validStates = Object.values(eventProgress).filter(v => typeof v === 'number');
		
		for (let i = 0; i < hooks.length; i++) {
			const hook = hooks[i];
			const validationErrors: string[] = [];
			
			if (hook.trigger_event_state_id === undefined || hook.trigger_event_state_id === null) {
				validationErrors.push('trigger_event_state_id is required');
			} else if (!validStates.includes(hook.trigger_event_state_id)) {
				validationErrors.push(`Invalid trigger_event_state_id. Must be one of: ${validStates.join(', ')}`);
			}
			
			if (!hook.action_type) {
				validationErrors.push('action_type is required');
			}
			
			if (!hook.action_config || Object.keys(hook.action_config).length === 0) {
				validationErrors.push('action_config is required');
			}
			
			if (validationErrors.length > 0) {
				res.errors!.push({
					index: i,
					params: hook,
					error: validationErrors.join('; ')
				});
			}
		}
		
		// If there are validation errors, rollback and return
		if (res.errors!.length > 0) {
			
			res.success = false;
			res.debug.validationResults = {
				validCount: hooks.length - res.errors!.length,
				errorCount: res.errors!.length,
				errors: res.errors
			};
			return res;
		}
		
		// Prepare bulk insert query
		const values: any[] = [];
		const placeholders: string[] = [];
		
		hooks.forEach((hook, index) => {
			placeholders.push('(?, ?, ?, ?, ?, ?)');
			values.push(
				eventId,
				hook.trigger_event_state_id,
				hook.action_type,
				JSON.stringify(hook.action_config),
				getUTCDatetime(),
				getUTCDatetime()
			);
			
			// Store params for results (without sensitive data)
			res.results.push({
				hookId: -1, // Will be updated after insert
				params: hook,
			});
		});
		
		const query = `
			INSERT INTO eventStateHooks (
				event_id,
				trigger_event_state_id,
				action_type,
				action_config,
				created_at,
				updated_at
			) VALUES ${placeholders.join(', ')}
		`;
		
		// Execute bulk insert
		const [result] = await connection.execute(query, values);
		
		// Get the inserted IDs
		const firstInsertId = result.insertId;
		
		// Update results with actual hook IDs
		for (let i = 0; i < res.results.length; i++) {
			res.results[i].hookId = firstInsertId + i;
			res.results[i].params.action_config = { data: '[PENDING]' };
		}
		
		res.success = true;
		res.debug.executionResults = {
			insertId: firstInsertId,
			affectedRows: result.affectedRows,
			insertedCount: res.results.length
		};
		
	} catch (error: any) {
		
		res.success = false;
		res.debug.error = {
			message: error.message,
			stack: error.stack
		};
		console.error('Error creating event state hooks:', error);
	}
	
	return res;
}
