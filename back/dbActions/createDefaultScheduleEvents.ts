import { add } from "date-fns";
import {ScheduleEvent} from "../models/ScheduleEvent";
import {getHash} from "../utils";

export async function createDefaultScheduleEvents (scheduleId: number, data?: any[]) {
    const now = new Date()
    const firstEventEnd = add(now, { minutes: 25 })
    const dataToCreate = [
        {
            timeFrom: now.toISOString(),
            timeTo: firstEventEnd.toISOString(),
            eventType: 'work',
            schedule_id: scheduleId,
            name: 'Работа'
        },
        {
            timeFrom: firstEventEnd.toISOString(),
            timeTo: add(firstEventEnd, { minutes: 5 }).toISOString(),
            eventType: 'rest',
            schedule_id: scheduleId,
            name: 'Отдых'
        }
    ]
    return await ScheduleEvent.bulkCreate(dataToCreate);
  }