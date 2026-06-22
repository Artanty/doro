import { EventProgressType } from "../../constants"

export interface SetPlayEventStateReq {
	eventId: number,
	scheduleId: number,
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
	is_rest: boolean,
	is_playing: boolean,
	playhead: number,
	
	schedule_id: number,
	// is_public: boolean,

	hooks: CreateEventReqHook[],
	schedule_position?: number,
};