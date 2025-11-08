import {ScheduleConfig} from "../models/ScheduleConfig";
import {ScheduleEvent} from "../models/ScheduleEvent";
import {getScheduleConfigById} from "./getScheduleConfigById";
import {getHash} from "../utils";
import {getCounter, setBusy} from "../index";
/**
 * counterIsPaused: false | true
 * Таймер перед остановкой может находиться в любом сотоянии
 * */
export async function stopScheduleEvent (
    scheduleConfigId: number,
    scheduleEventId: number,
    scheduleId: number): Promise<ScheduleConfig> {
    return await ScheduleConfig.findOne({
        where:
            {
                configIsActive: true,
                schedule_id: scheduleId,
                id: scheduleConfigId,
            },
        rejectOnEmpty: true
    }).then( async (scheduleConfig: ScheduleConfig) => {
        return await scheduleConfig.update({
            scheduleEvent_id: scheduleEventId,
            counterIsPaused: true,
            hash: getHash(Math.floor(Math.random() * 10), new Date().getTime()),
            counterTimePassed: 0
        })
    })
}

export async function stopEvent (
    config: ScheduleConfig
    ): Promise<ScheduleConfig> {
        config.counterIsPaused = true
        config.hash = getHash(Math.floor(Math.random() * 10), new Date().getTime())
        config.counterTimePassed = 0
        config.dateModificator = 'new1'
        return await config.save()
}
