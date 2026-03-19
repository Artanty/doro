import { EventStateHook } from "../event-state-hook.controller";
//unused
export const setHooksEventId = (hooks: EventStateHook[], eventId: number): EventStateHook[] => {
	return hooks.map(el => {
		el.event_id = eventId;
		return el;
	})
}