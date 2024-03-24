import {ScheduleConfig} from "../models/ScheduleConfig";
import {getHash} from "../utils";
import {Database} from "../core/dbConnect";
import {Schedule} from "../models/Schedule";
import {ScheduleEvent} from "../models/ScheduleEvent";
import {
    add,
    startOfToday
} from "date-fns";

export async function saveDefaultScheduleConfig () {
    await Database.getInstance().query('SET FOREIGN_KEY_CHECKS = 0');
    // const result = await ScheduleConfig.create({
    //     hash: getHash(Math.floor(Math.random() * 10), new Date().getTime()),
    //     // date: undefined,
    //     // weekDay: undefined,
    //     // dateModificator: undefined,
    //     // schedule_id: 1,
    //     schedule: {
    //         name: 'Таймер по умолчанию',
    //         scheduleType: 'default',
    //     },
    //     include: ['schedule']
    // })
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
    return await ScheduleConfig.create({
        schedule_id: newSchedule.id,
        hash: hash,
        scheduleHash: hash,
        scheduleEventsHash: hash,
        configIsActive: true
    })
}
