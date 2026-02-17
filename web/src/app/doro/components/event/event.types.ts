import { basicEventTypePrefix, devPoolId, EventProgressType, EventStates, EventStatesType } from '../../constants';


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

export interface EventProps {
	id: number;
	name: string;
	length: number;
	type: number;
	// type_name: string; // replace to dictionaries
	created_at: string;
	updated_at: string | null;
	created_by: string; // hide on backend
	schedule_id: number | null;
	schedule_position: number | null;
	// base_access: "public-read"; //remove on backend
	base_access_id: number;
	// access_level: "owner" | "editor" | "viewer"; //remove on backend
	has_access: number; // 0 or 1 (boolean)
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

export interface EventStateReq {
	"eventId": number, 
	"state": number
}


export interface SetPlayEventStateReq {
	"eventId": number
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
