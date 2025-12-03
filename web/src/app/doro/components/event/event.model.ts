export interface EventViewState<T = null> {
	viewState: string,
	eventState: string
	data?: T,
	error?: any
}

export interface EventProps {
	"id": number
	"eventId": number
	"state": number
	"created_at": string
	"updated_at": string
	"event_name": string
	"length": number
	"type": number
	"event_type_name": string
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
	"connectionId": string, 
	"state": number
}