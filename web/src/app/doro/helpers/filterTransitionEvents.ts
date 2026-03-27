import { BusEvent } from "typlib"
import { EventStates, eventTypes } from "../constants";
import { EventProps } from "../services/basic-event/basic-event.types";

export const filterTransitionEvents = (eventProps: EventProps) => {
	return eventProps.type === eventTypes.TRANSITION
};

export const filterActiveTransitionEvents = (eventProps: EventProps) => {
	return eventProps.type === eventTypes.TRANSITION && eventProps.current_state !== EventStates.COMPLETED

};
