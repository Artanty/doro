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


export const basicEventTypePrefix = 'e';

export const eventTypes = {
	REST: 3,
	WORK: 2
}