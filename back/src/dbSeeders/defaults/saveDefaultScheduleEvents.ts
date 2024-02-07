import {Schedule} from "../../models/Schedule";
import {ScheduleEvent} from "../../models/ScheduleEvent";
import {
    add,
    startOfToday
} from "date-fns";


export async function saveDefaultScheduleEventWork (schedule_id: number) {
    return await ScheduleEvent.build({
        timeFrom: add(startOfToday(), { hours: 10 }).toISOString(),
        timeTo: add(startOfToday(), { hours: 10, minutes: 25 }).toISOString(),
        eventType: 'work',
        schedule_id: schedule_id,
        name: 'Работа'
    }).save()
}

export async function saveDefaultScheduleEventRest (schedule_id: number) {
    return await ScheduleEvent.build({
        timeFrom: add(startOfToday(), { hours: 10, minutes: 25 }).toISOString(),
        timeTo: add(startOfToday(), { hours: 10, minutes: 30 }).toISOString(),
        eventType: 'rest',
        schedule_id: schedule_id,
        name: 'Отдых'
    }).save()
}
