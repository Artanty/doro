import {ScheduleConfig} from "../models/ScheduleConfig";
import {getHash} from "../utils";

/**
 * @deprecated
 */
export async function saveScheduleConfig () {
    const hash = getHash(Math.floor(Math.random() * 10), new Date().getTime())
    return await ScheduleConfig.build({
        // date: undefined,
        // weekDay: undefined,
        // dateModificator: undefined,
        schedule_id: 1,
        hash: hash,
        scheduleHash: hash,
        scheduleEventsHash: hash
    }).save()
}