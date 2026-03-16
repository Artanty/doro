import { EventProps } from "../services/event.types";
import { eventTypes } from "../constants";

export const filterBasicEvents = (eventProps: EventProps) => {
	return [eventTypes.WORK, eventTypes.REST].includes(eventProps.type)
};