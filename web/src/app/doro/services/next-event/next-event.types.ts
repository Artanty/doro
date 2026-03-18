import { eventTypes } from "../../constants";
import { Nullable } from "../../helpers/utility.types";
import { SuggestRestRes } from "../api/schedule.types.api"
import { EventProps, EventStateReq } from "./../event.types";


export interface NextCalculatedEvent {
	type: typeof eventTypes[keyof typeof eventTypes],
	data: Nullable<SuggestRestRes>,
	schedule_id: number
	schedule_position: number
};

export interface NextSuggestionsRes {
	endedEvent: EventProps
	nextEventsBySchedule: EventProps[]
	nextCalculatedEvent: Nullable<NextCalculatedEvent>
}