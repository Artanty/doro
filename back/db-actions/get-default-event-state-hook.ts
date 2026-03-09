import { getUTCDatetime } from "../utils/get-utc-datetime"

export const getDefaultEventStateHook = (eventId: number) => {
	return {
		id: 0,
		event_id: eventId,
		trigger_event_state_id: 3,
		action_type: 'script',
		action_config: { scriptId: 'nextEvent' },
		created_at: getUTCDatetime(),
		updated_at: getUTCDatetime(),
	}
}