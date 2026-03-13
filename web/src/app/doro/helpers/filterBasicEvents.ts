import { EventProps } from "../services/event.types";
import { eventTypes } from "../constants";

export const filterBasicEvents = (eventProps: EventProps) => {
	return eventProps.type === (eventTypes.WORK || eventTypes.REST)
};