import {ScheduleConfig} from "../models/ScheduleConfig";
import {dd, getHash} from "../utils";
import {Database} from "../core/dbConnect";
import {Schedule} from "../models/Schedule";
import {ScheduleEvent} from "../models/ScheduleEvent";
import {
    add,
    startOfToday
} from "date-fns";
import { createUser } from "./createUser";

export async function createDefaultScheduleConfig () {
    dd('Содание пользователя, конфига, расписания и 2 событий по умолчанию')
    await Database.getInstance().query('SET FOREIGN_KEY_CHECKS = 0');
    const result = await createScheduleAndConfig();
    await Database.getInstance().query('SET FOREIGN_KEY_CHECKS = 1');
    return result
}

async function createScheduleAndConfig() {
    const newSchedule = await Schedule.create({
        name: 'Таймер по умолчанию',
        scheduleType: 'default',
    })
    await ScheduleEvent.create({
        timeFrom: add(startOfToday(), { hours: 10 }).toISOString(),
        timeTo: add(startOfToday(), { hours: 10, minutes: 25 }).toISOString(),
        eventType: 'work',
        schedule_id: newSchedule.id,
        name: 'Работа'
    })
    await ScheduleEvent.create({
        timeFrom: add(startOfToday(), { hours: 10, minutes: 25 }).toISOString(),
        timeTo: add(startOfToday(), { hours: 10, minutes: 30 }).toISOString(),
        eventType: 'rest',
        schedule_id: newSchedule.id,
        name: 'Отдых'
    })
    const hash = getHash(Math.floor(Math.random() * 10), new Date().getTime())
    const config = await ScheduleConfig.create({
        schedule_id: newSchedule.id,
        hash: hash,
        scheduleHash: hash,
        scheduleEventsHash: hash,
        configIsActive: true
    })
    return await createUser('Artey', 'password', config.id)
}
