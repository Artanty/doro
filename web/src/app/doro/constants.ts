import { ViewStatus } from "./types/view-state.type";

export const devPoolId = 'current_user_id'

export const EventProgress = {
	'STOPPED': 0,
	'PLAYING': 1,
	'PAUSED': 2,
	'COMPLETED': 3
} as const; // Определяем как константные объекты

export const EventCommonState = {
	'PENDING': -1,
	'ERROR': -2
} as const;

export const EventStates = {
	...EventProgress,
	...EventCommonState
} as const;

export type EventProgressType = typeof EventProgress[keyof typeof EventProgress];
export type EventCommonStateType = typeof EventCommonState[keyof typeof EventCommonState];
export type EventStatesType = EventProgressType | EventCommonStateType;


export const EventTypePrefix = {
	BASIC: 'e',
	TRANSITION: 't'
}

export const eventTypes = {
	WORK: 1,
	REST: 2,
	TRANSITION: 3,
} as const;

export type TEventType = typeof eventTypes[keyof typeof eventTypes];

export const BASE_SCHEDULE_ID = 1;

export const INITIAL_VIEW_STATE = {
	status: ViewStatus.LOADING,
}

export const DEFAULT_EVENT_STATE_HOOKS = [
	{
		"trigger_event_state_id": 3,
		"action_type": "script",
		"action_config": {
			"scriptId": "nextEvent"
		}
	}
]

export const DEFAULT_WORK_EVENT_LENGTH = 20 //60 * 25;