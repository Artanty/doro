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
	"id": number
	"name": string
	"length": number
	"type": number
	"created_at": string
	"type_name": string
	"access_level": string
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

export type GetUserEventsRes = Record<string, {
	data: EventProps[]
}>

export type EventStateResItemStateless = Omit<EventStateResItem, 'stt'> & { prc: number }
