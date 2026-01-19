import { BusEvent } from "typlib"
import { dd } from "./dd";

export const filterStreamDataEntries = (busEvent: BusEvent) => {
	// dd(busEvent)
	return busEvent.event === 'SSE_DATA'
};