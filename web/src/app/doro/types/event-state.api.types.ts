import { Schedule } from "../services/event/event.types"

type EventStatus = any
type EventPropsDbItem = any

export type EventWithStateDTO = 
	EventPropsDbItem & { eventState: EventStatus }

export type ScheduleWithEventsDTO = 
	Schedule & { events: EventWithStateDTO }

export interface GetRecentEventOrScheduleRes {
	recentEvent: EventWithStateDTO,
	recentSchedule: ScheduleWithEventsDTO,
}