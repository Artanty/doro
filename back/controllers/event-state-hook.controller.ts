import { eventProgress } from "../core/constants";
import { createEvent } from "../db-actions/create-event";
import { upsertEventAccess } from "../db-actions/upsert-event-access";
import { upsertEventState } from "../db-actions/upsert-event-state";
import { thisProjectResProp } from "../utils/getResProp";
import { ConfigManager } from "./config-manager";
import { OuterEntry, OuterSyncService } from "./outer-sync.service";


export interface EventStateHook {
	id: number;
	event_id: number;
	trigger_event_state_id: eventProgress;
	action_type: string;
	action_config: {
		scriptId?: string;
		next_event_type?: number;
		next_event_length?: number;
		[key: string]: any;
	};
	created_at: string;
	updated_at: string;
}

export interface RunHooksResult {
	success: boolean;
	result: OuterEntry[],
	results: Array<{
		hookId: number;
		action_type: string;
		result: any;
	}>;
	errors: Array<{
		hookId: number;
		action_type: string;
		error: string;
	}>;
}

export interface CreateTransitionEvent {
	success: boolean, 
	result: OuterEntry[],
	error?: any,
	debug: any 
}

export class EventStateHookController {
	
	/**
	 * Run all hooks for an event
	 */
	static async runHooks(
		connection: any, 
		hooks: EventStateHook[]
	): Promise<RunHooksResult> {
		
		const results: RunHooksResult = {
			success: true,
			result: [],
			results: [],
			errors: [],
		};
		
		// Use for...of to properly handle async
		for (const hook of hooks) {
			try {
				let hookResult;
				
				// Parse action_type (remove quotes if they exist)
				const actionType = hook.action_type.replace(/"/g, '');
				
				switch (actionType) {
					case 'script':
						if (hook.action_config?.scriptId === 'nextEvent') {
							const config = {
								...hook.action_config,
								// next_event_type: 3,
								// next_event_length: 86400,
							}
							const created_from = `h_${hook.id}`;

							hookResult = await this.createTransitionEvent(
								connection, 
								hook.event_id,
								created_from,
								config,
							);
						}
						break;
						
					case 'webhook':
						// Handle webhook
						break;
						
					case 'email':
						// Handle email
						break;
						
					default:
						console.warn(`Unknown action type: ${actionType}`);
				}
				
				if (hookResult) {
					results.result.push(...hookResult.result);
					results.results.push({
						hookId: hook.id,
						action_type: actionType,
						result: hookResult
					});
				}
				
			} catch (error: any) {
				results.errors.push({
					hookId: hook.id,
					action_type: hook.action_type,
					error: error.message
				});
				// Don't throw, continue with other hooks
				console.error(`Error running hook ${hook.id}:`, error);
			}
		}
		
		// Mark as failed if any errors occurred
		if (results.errors.length > 0) {
			results.success = false;
		}
		
		return results;
	}

	/**
	 * Create a transition event (triggered by 'nextEvent' script)
	 */
	static async createTransitionEvent(
		connection: any, 
		eventId: number,
		created_from: string,
		config?: any
	): Promise<CreateTransitionEvent> {
		
		let createEventResult,
			upsertEventAccessResult,
			upsertEventStateResult,
			createEventStateHookResult

		
		try {
			// Get source event -todo upd to accessible
			const [events] = await connection.execute(
				`SELECT * FROM events WHERE id = ?`,
				[eventId]
			);
			
			if (events.length === 0) {
				throw new Error(`Event ${eventId} not found`);
			}
			
			const sourceEvent = events[0];
			
			// Configuration with defaults
			const transitionEventType = config?.next_event_type || 3;
			const transitionEventState = eventProgress.PLAYING; // 1 = PLAYING
			const transitionEventLength = config?.next_event_length || 86400; // 1 day default

			createEventResult = await createEvent(
				connection, 
				`On finish: ${sourceEvent.name}`, 
				transitionEventLength, 
				transitionEventType, 
				sourceEvent.created_by, 

				sourceEvent.schedule_id, // schedule_id: 
				999, //schedule_position

				sourceEvent.base_access_id,
				created_from
			);
			
			if (createEventResult.error) {
				throw new Error(createEventResult.error);
			}
			
			const transitionEventId = createEventResult.result;
			
			// Set access (3 = owner)
			upsertEventAccessResult = await upsertEventAccess(
				connection, 
				transitionEventId, 
				sourceEvent.created_by, 
				3
			);
			
			// Set initial state
			upsertEventStateResult = await upsertEventState(
				connection, 
				transitionEventId, 
				transitionEventState
			);
			
			const eventsPayload: any[] = OuterSyncService.buildNewOuterEventPayload(
				transitionEventId, 
				transitionEventLength, 
				transitionEventState, 
				'transition'
			);
			
			return {
				success: true,
				result: eventsPayload,
				debug: {
					[thisProjectResProp()]: {
						createEventResult,
						upsertEventAccessResult,
						upsertEventStateResult,
						createEventStateHookResult
					}
				}
			};
			
		} catch (error: any) {
			return {
				success: false,
				result: [],
				debug: {
					[thisProjectResProp()]: {
						createEventResult,
						upsertEventAccessResult,
						upsertEventStateResult,
						createEventStateHookResult
					}
				},
				error
			};
		}
	}
}