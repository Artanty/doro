import { deleteFinishedEventsCtl as deleteFinishedEvents } from './delete-finished-events.ctl'
import { updateEventStateCtl as updateEventState } from './update-event-state.ctl'
import { getEventsWithStatusCtl as getEventsWithStatus } from './get-events-with-status.ctl'
import { playOrDuplicateEventCtl as playOrDuplicateEvent } from './play-or-duplicate-event.ctl'
import { stopEventRunHooksCtl as stopEventRunHooks } from './stop-event-run-hooks'
import { pauseEventCtl as pauseEvent } from './pause-event.ctl'


export const EventStateController = {
	deleteFinishedEvents,
	updateEventState,
	getEventsWithStatus,
	playOrDuplicateEvent,
	stopEventRunHooks,
	pauseEvent,
}