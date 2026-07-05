import { suggestRestCtl as suggestRest } from './suggest-rest.ctl';
import { getSchedulesCtl as getSchedules } from './get-schedules.ctl';
import { createScheduleCtl as createSchedule } from './create-schedule.ctl';
import { createFullScheduleCtl as createFullSchedule } from './create-full-schedule.ctl';
import { deleteScheduleCtl as deleteSchedule } from './delete-schedule.ctl';

export const ScheduleController = {
	suggestRest,
	getSchedules,
	createSchedule,
	createFullSchedule,
	deleteSchedule
}