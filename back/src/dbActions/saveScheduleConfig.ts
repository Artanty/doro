import {ScheduleConfig} from "../models/ScheduleConfig";
import {getHash} from "../utils";

export async function saveScheduleConfig () {
    return await ScheduleConfig.build({
        hash: getHash(Math.floor(Math.random() * 10), new Date().getTime()),
        // date: undefined,
        // weekDay: undefined,
        // dateModificator: undefined,
        schedule_id: 1,
    }).save()
}