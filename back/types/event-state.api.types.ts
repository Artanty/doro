import { Nullable } from "../utils/utility.types";
import { EventStatus } from "./event-state.types";
import { EventPropsDbItem } from "./event.types";
import { Schedule } from "./schedule.types";

export type EventWithStateDTO = 
	EventPropsDbItem & { 
		eventState: EventStatus,
		eventStateHooks: []
	}

export type ScheduleWithEventsDTO = 
	Schedule & { events: EventWithStateDTO }

export interface GetRecentEventOrScheduleRes {
	recentEvent: Nullable<EventWithStateDTO>,
	recentSchedule: Nullable<ScheduleWithEventsDTO>,
}