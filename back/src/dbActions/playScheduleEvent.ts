import {ScheduleConfig} from "../models/ScheduleConfig";
import {ScheduleEvent} from "../models/ScheduleEvent";
import {getScheduleConfigById} from "./getScheduleConfigById";
import {getHash} from "../utils";
import {getCounter} from "../index";
/**
 * Проигрываем scheduleEvent начиная с текущего момента,
 * вне зависимости от предыдущего состояния таймера
 * */
export async function playScheduleEvent (
    scheduleConfigId: number,
    scheduleEventId: number,
    scheduleId: number): Promise<ScheduleConfig | null> {
    const result = await ScheduleConfig.findOne({
        where:
            {
                configIsActive: true,
                schedule_id: scheduleId,
                id: scheduleConfigId,
                counterIsPaused: true,
            },
        rejectOnEmpty: true
    }).then( async (scheduleConfig: ScheduleConfig | null) => {
        if (scheduleConfig) {
            await scheduleConfig.update({
                scheduleEvent_id: scheduleEventId,
                counterIsPaused: false,
                counterStartTime: new Date().toISOString(),
                hash: getHash(Math.floor(Math.random() * 10), new Date().getTime()),
                counterTimePassed: 0
            })
        }
        return scheduleConfig
    })
    console.log(result)
    return result
}