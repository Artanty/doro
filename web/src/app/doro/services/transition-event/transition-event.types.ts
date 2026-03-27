import { TEventType } from "../../constants";
import { Nullable } from "../../helpers/utility.types";
import { EventProps } from "../basic-event/basic-event.types";
import { SuggestRestRes } from "../schedule/schedule.api.types";

export interface NextCalculatedEvent {
	type: TEventType,
	length: number,
	schedule_id: number
	schedule_position: number,
	debug: Nullable<SuggestRestRes> | any
};

export interface NextSuggestionsRes {
	endedEvent: EventProps
	nextEventBySchedule: Nullable<EventProps>
	nextCalculatedEvent: Nullable<NextCalculatedEvent>
}

export interface EventStateHook {
	"id": number
	"event_id": number
	"trigger_event_state_id": number // 3 - COMPLETE
	"action_type": string
	"action_config": {
		"scriptId": string
	},
	"created_at": string
	"updated_at": string
}