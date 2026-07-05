import { GetEventResDataItem } from "@contracts/event.contract";
import { EventStates, eventTypes } from "../constants";
import { EventProps } from "../services/basic-event/basic-event.types";

export const filterBasicEvents = (eventProps: GetEventResDataItem) => {
	// return [eventTypes.WORK, eventTypes.REST].includes(eventProps.type as any)
	return true;
};

export const filterActiveBasicEvents = (eventProps: EventProps) => {
	return [eventTypes.WORK, eventTypes.REST].includes(eventProps.type as any) 
		&& [EventStates.PLAYING, EventStates.PAUSED].includes(eventProps.current_state as any);
};
