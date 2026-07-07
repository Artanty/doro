import { BusEvent } from "typlib"
import { dd } from "./dd";

export interface ConfigHashTikEntry { id: string, cur: number };

export const mapBusEventToConfigHashTikEntry = (
	busEvent: BusEvent,
	hashType: string
): ConfigHashTikEntry | undefined => {
	let hashId = ''
	if (hashType === 'events') {
		hashId = 'h_1';
	} else if (hashType === 'schedules') {
		hashId = 'h_2';
	} else if (hashType === 'tikErrors') {
		hashId = 'err_0';
	} else {
		throw new Error(`hashType ${hashType} not implemented`);
	}
	// const hashId = hashType === 'events' ? 'h_1' : 'h_2';
	const foundEntry = busEvent.payload
		.find((entry: any) => entry.id === hashId);
	// dd('config hash entry found')
	return foundEntry;
};