import {ScheduleConfig} from "../models/ScheduleConfig";
import {ScheduleEvent} from "../models/ScheduleEvent";
import {getScheduleConfigById} from "./getScheduleConfigById";
import {getHash} from "../utils";
import {getCounter} from "../index";

export async function pauseScheduleEvent (
    scheduleConfigId: number,
    scheduleEventId: number,
    scheduleId: number): Promise<ScheduleConfig | null> {
    return await ScheduleConfig.findOne({
        where:
            {
                configIsActive: true,
                schedule_id: scheduleId,
                id: scheduleConfigId,
                counterIsPaused: false,
            },
        rejectOnEmpty: true
    }).then( async (scheduleConfig: ScheduleConfig | null) => {
        if (scheduleConfig) {
            await scheduleConfig.update({
                scheduleEvent_id: scheduleEventId,
                counterIsPaused: true,
                hash: getHash(Math.floor(Math.random() * 10), new Date().getTime()),
                counterTimePassed: getCounter()
            })
        }
        return scheduleConfig
    })

}