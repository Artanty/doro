import { EventStates, EventTypePrefix } from "../constants";
import { EventStateResItem } from "../services/basic-event/basic-event.types";

export const findActiveTikTransitionEvent = (
	eventsStates: EventStateResItem[]
): EventStateResItem | undefined => {
	return eventsStates.filter(filterTikTransitions)
		.find(el => el.stt === EventStates.PLAYING)
}

export const filterTikTransitions = (el: EventStateResItem) => {
	return el.id.split('_')[0] === EventTypePrefix.TRANSITION;
}


export const findActiveTikBasicEvent = (
	eventsStates: EventStateResItem[]
): EventStateResItem | undefined => {
	return eventsStates.filter(filterTikBasicEvents)
		.find(el => el.stt === EventStates.PLAYING)
}

export const filterTikBasicEvents = (el: EventStateResItem) => {
	return el.id.split('_')[0] === EventTypePrefix.BASIC;
}