import {ScheduleEvent} from "../models/ScheduleEvent";
import {getHash} from "../utils";

export async function createScheduleEvent (data: any) {
    return await ScheduleEvent.build({
        name: data.name,
        timeFrom: data.timeFrom,
        timeTo: data.timeTo,
        eventType: data.eventType,
        schedule_id: data.schedule_id
    }).save()
}
