import { BusEvent } from "typlib"
import { EventProps } from "../services/event.types";
import { EventStates, eventTypes } from "../constants";

export const filterTransitionEvents = (eventProps: EventProps) => {
	return eventProps.type === eventTypes.TRANSITION
};

export const filterActiveTransitionEvents = (eventProps: EventProps) => {
	return eventProps.type === eventTypes.TRANSITION && eventProps.current_state !== EventStates.COMPLETED

};
