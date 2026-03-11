import { getEventCtl as getEvents } from './get-event.ctl'
import { createEventCtl as createEvent } from './create-event.ctl'
import { updateEventCtl as updateEvent } from './update-event.ctl'
import { deleteEventCtl as deleteEvent } from './delete-event.ctl'


export const EventController = {
	getEvents,
	createEvent,
	updateEvent,
	deleteEvent
}