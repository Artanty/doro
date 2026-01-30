import { BusEvent } from "typlib"
import { dd } from "./dd";

export interface ConfigHashTikEntry { id: string, cur: number };

export const mapBusEventToConfigHashTikEntry = (
	busEvent: BusEvent
): ConfigHashTikEntry | undefined => {
	const foundEntry = busEvent.payload
		.find((entry: any) => entry.id === 'h_1');
	// dd('config hash entry found')
	return foundEntry;
};