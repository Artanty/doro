import { BusEvent } from "typlib"
import { EventStates, eventTypes } from "../constants";
import { EventProps } from "../services/event/event.types";

export const filterTransitionEvents = (eventProps: EventProps) => {
	return eventProps.type === eventTypes.TRANSITION
};

export const filterActiveTransitionEvents = (eventProps: EventProps) => {
	return eventProps.type === eventTypes.TRANSITION && eventProps.current_state !== EventStates.COMPLETED

};
