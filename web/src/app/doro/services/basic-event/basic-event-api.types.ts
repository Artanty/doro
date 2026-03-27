import { EventProgressType } from "../../constants"

export interface SetPlayEventStateReq {
	"eventId": number
}

export interface CreateEventReqHook {
	"trigger_event_state_id": number,
	"action_type": string
	"action_config": {
		"scriptId": string
	}
}

export interface CreateEventReq {
	name: string
	length: number
	type: number
	base_access: number
	state: EventProgressType,
	"hooks": CreateEventReqHook[],
	schedule_id?: number,
	schedule_position?: number,
};