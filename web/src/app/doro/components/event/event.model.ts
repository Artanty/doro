export interface DoroEvent {
	"id": number
	"name": string
	"length": number
	"type": number
	"created_at": string
	"type_name": string
	"access_level": string
}
export interface EventWithState {
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