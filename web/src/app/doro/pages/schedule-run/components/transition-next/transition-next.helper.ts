import { eventTypes } from "src/app/doro/constants";
import { EventProps, EventStateResItem } from "src/app/doro/services/basic-event/basic-event.types";

export const getEmptyEventProps = (scheduleId: number): EventProps => ({
	id: 0,
	name: '',
	length: 0,
	type: eventTypes.TRANSITION_NEXT,
	created_at: '',
	updated_at: '',
	created_by: '',
	schedule_id: scheduleId,
	schedule_position: 0,
	base_access_id: 0,
	event_state_id: 0,
	has_access: 0,
	state_hooks: [],
	created_from: '',
	current_state: 0,
})

export const getEmptyEventState = (): EventStateResItem => ({
	id: '',
	cur: 0,
	len: 0,
	stt: 0,
})