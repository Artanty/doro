import { EventProgressType, EventStatesType } from "../../constants"

export interface EventStateResItem { // todo: rename to entry
	id: string,
	cur: number,
	len?: number,
	stt?: EventProgressType
}


export interface EventViewState<T = null> {
	viewState: string,
	eventState?: EventStatesType
	data?: T,
	error?: any
}

export interface EventStateHook {
	"id": number
	"created_at": string
	"updated_at": string
	"action_type": string
	"action_config": any
	"trigger_event_state_id": number
}

export interface EventProps {
	id: number;
	name: string;
	length: number;
	type: number;
	// type_name: string; // replace to dictionaries
	created_at: string;
	updated_at: string | null;
	created_by: string; // hide on backend
	schedule_id: number;
	schedule_position: number;
	// base_access: "public-read"; //remove on backend
	base_access_id: number;
	event_state_id: number;
	// access_level: "owner" | "editor" | "viewer"; //remove on backend
	has_access: number; // 0 or 1 (boolean)
	state_hooks: EventStateHook[],
	created_from: string,

	current_state: number
}
export const EVENT_PROPS_KEY = 'doroProps' as const;
export const EVENT_STATE_KEY = 'tikState' as const;

export interface EventPropsWithState {
	[EVENT_PROPS_KEY]: EventProps,
	[EVENT_STATE_KEY]: EventStateResItem,
	allScheduleEvents: EventProps[],
	allScheduleEventsUnfiltered: EventProps[],
}

export interface EventWithState { // todo rename
	"id": number
	"eventId": number
	"connectionId": string
	"userHandler": string
	"state": number
	"created_at": string
	"updated_at": string
	"event_name": string
	"length": number
	"type": number
	"event_type_name": string
}

export interface EventState {
	"eventId": number,
	"connectionId": string
	"state": number,
	"userHandler": string
	"created": boolean
	"updated": boolean
}


export interface EventStateRes {
	"eventState": EventState
}

export interface EventStateReqItem { 
	eventId: any, state: any 
}
export interface EventStateReq {
	eventStates: EventStateReqItem[]
}




export interface EventData {
	data: any
	state: string
	initialEvent: EventWithState
}

export type GetUserEventsRes = {
	data: EventProps[]
}

export interface Schedule {
	id: number;
	name: string;
	created_by: string;
	created_at: Date | string;
	updated_at: Date | string;
	// events?: EventProps[];
}



export type EventStateResItemStateless = Omit<EventStateResItem, 'stt'> & { prc: number }
