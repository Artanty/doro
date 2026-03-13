import { BusEvent } from "typlib"
import { EventProps } from "../services/event.types";
import { eventTypes } from "../constants";

export const filterTransitionEvents = (eventProps: EventProps) => {
	return eventProps.type === eventTypes.TRANSITION
};