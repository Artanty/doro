import { BusEvent } from "typlib"
import { dd } from "./dd";

export interface ConfigHashTikEntry { id: string, cur: number };

export const mapBusEventToConfigHashTikEntry = (
	busEvent: BusEvent,
	hashType: string
): ConfigHashTikEntry | undefined => {
	const hashId = hashType === 'events' ? 'h_1' : 'h_2';
	const foundEntry = busEvent.payload
		.find((entry: any) => entry.id === hashId);
	// dd('config hash entry found')
	return foundEntry;
};