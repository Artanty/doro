import { BusEvent } from "typlib"

export const filterStreamDataEvents = (busEvent: BusEvent) => {
	return busEvent.event === 'STREAM_DATA'
};