import { TEventType } from "../../constants";
import { Nullable } from "../../helpers/utility.types";
import { SuggestRestRes } from "../api/schedule.types.api"
import { EventProps } from "../event/event.types";

export interface NextCalculatedEvent {
	type: TEventType,
	length: number,
	schedule_id: number
	schedule_position: number,
	debug: Nullable<SuggestRestRes> | any
};

export interface NextSuggestionsRes {
	endedEvent: EventProps
	nextEventsBySchedule: EventProps[]
	nextCalculatedEvent: Nullable<NextCalculatedEvent>
}