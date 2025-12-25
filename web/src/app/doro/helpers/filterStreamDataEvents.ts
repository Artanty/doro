import { BusEvent } from "typlib"
import { dd } from "./dd";

export const filterStreamDataEvents = (busEvent: BusEvent) => {
	dd(busEvent)
	return busEvent.event === 'SSE_DATA'
};

export const filterSSEPayloadByEventId = (busEvent: BusEvent) => { // no use
	return busEvent.event === 'SSE_DATA'
};