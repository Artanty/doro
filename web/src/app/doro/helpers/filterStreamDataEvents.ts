import { BusEvent } from "typlib"
import { dd } from "./dd";

export const filterStreamDataEvents = (busEvent: BusEvent) => {
	return busEvent.event === 'SSE_DATA'
};