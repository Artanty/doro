import {ScheduleConfig} from "../models/ScheduleConfig";
import {ScheduleEvent} from "../models/ScheduleEvent";
import {getScheduleConfigById} from "./getScheduleConfigById";
import {getHash} from "../utils";
/**
 * Проигрываем scheduleEvent начиная с момента,
 * на котором остановились
 * */
export async function resumeScheduleEvent (
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
                hash: getHash(Math.floor(Math.random() * 10), new Date().getTime())
            })
        }
        return scheduleConfig
    })
    return result
}