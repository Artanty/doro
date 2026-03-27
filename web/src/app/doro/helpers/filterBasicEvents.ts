import { EventStates, eventTypes } from "../constants";
import { EventProps } from "../services/basic-event/basic-event.types";

export const filterBasicEvents = (eventProps: EventProps) => {
	return [eventTypes.WORK, eventTypes.REST].includes(eventProps.type as any)
};

export const filterActiveBasicEvents = (eventProps: EventProps) => {
	return [eventTypes.WORK, eventTypes.REST].includes(eventProps.type as any) 
		&& [EventStates.PLAYING, EventStates.PAUSED].includes(eventProps.current_state as any);
};
