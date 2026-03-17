import { EventStatus, MinimalEventProps } from "./event-state.types"

export interface EventPropsDbItem {
	"id": number
	"name": string
	"length": number
	"type": number
	"created_at": string
	"updated_at": string | null,
	"schedule_id": number,
	"schedule_position": number,
	"created_by": string, //todo remve
	"base_access_id": number //todo remve
}

export const toMinProps = (dbItem: EventPropsDbItem): MinimalEventProps => {
	// debugger;
	return {
		"id": dbItem.id,
		"length": dbItem.length,
		"event_type": dbItem.type,
	}
}