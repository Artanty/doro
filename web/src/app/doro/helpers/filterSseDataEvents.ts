import { BusEvent } from "typlib"

export const filterSseDataEvents = (busEvent: BusEvent) => {
	return busEvent.event === 'SSE_DATA'
}