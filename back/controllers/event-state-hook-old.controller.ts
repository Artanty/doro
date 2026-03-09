import { createEvent } from "../db-actions/create-event";
import { EventStateHook, getEventStateHooksByState } from "../db-actions/get-event-state-hooks";
import { upsertEventAccess } from "../db-actions/upsert-event-access";
import { upsertEventState } from "../db-actions/upsert-event-state";
import { thisProjectResProp } from "../utils/getResProp";
import { ConfigManager } from "./config-manager";
import { OuterEntry, OuterSyncService } from "./outer-sync.service";

export class EventStateHookController {
	static async runHooks(connection: any, hooks: EventStateHook[]) {
		let runHooksResult;
		
		hooks.forEach(async hook => {
			if (hook.action_type === '"script"') {
				if (hook.action_config?.scriptId === 'nextEvent') {
					if (hook.event_id) {
						// добавляем ивент с типом 3 в тотже schedule
						runHooksResult = await this.createTransitionEvent(connection, hook.event_id)
					}
				}
			}
		})
		return runHooksResult;
	}

	static async createTransitionEvent(connection, eventId): Promise<{ success: boolean, result: OuterEntry[], debug: any }> {
		let createEventResult,
			createEventStateHookResult,
			upsertEventAccessResult,
			upsertEventStateResult;

		const [event] = await connection.execute(
			`SELECT * FROM events WHERE id = ?`,
			[eventId]
		);
		const transitionEventType = 3;
		const transitionEventState = 3; //playing
		const transitionEventLength = 86400; // day by default
		const { name, userHandler, base_access } = event[0];

		createEventResult = await createEvent(
			connection, `On finish: ${name}`, 
			transitionEventLength, 
			transitionEventType, 
			userHandler, 
			base_access
		);
		if (createEventResult.error) {
			throw new Error(createEventResult.error);
		}
		const transitionEventId = createEventResult.result;

		upsertEventAccessResult = await upsertEventAccess(connection, transitionEventId, userHandler, 3);

		upsertEventStateResult = await upsertEventState(connection, transitionEventId, transitionEventState);

		ConfigManager.setConfigHash(); 
		
		const hashPayload = OuterSyncService.buildUpdateOuterHashPayload('upsert');
		const eventsPayload = OuterSyncService.buildNewOuterEventPayload(
			transitionEventId, 
			transitionEventLength, 
			transitionEventState, 
			'transition');
	
		return {
			success: true,
			result: [...hashPayload, ...eventsPayload],
			debug: {
				[thisProjectResProp()]: {
					createEventResult,
					createEventStateHookResult,
					upsertEventAccessResult,
					upsertEventStateResult,
						
				},
			}
		};
	}
}