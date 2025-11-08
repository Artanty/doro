import {getLatestScheduleConfig} from "../dbActions/getLatestScheduleConfig";
import {ScheduleConfig} from "../models/ScheduleConfig";
import {getScheduleConfigById} from "../dbActions/getScheduleConfigById";
import {activateScheduleConfig} from "../dbActions/activateScheduleConfig";
import {playScheduleEvent} from "../dbActions/playScheduleEvent";
import {getScheduleEventById} from "../dbActions/getScheduleEventById";
import CounterActionController from "./counterAction";
import {ScheduleEvent} from "../models/ScheduleEvent";
import {pauseScheduleEvent} from "../dbActions/pauseScheduleEvent";
import {resumeScheduleEvent} from "../dbActions/resumeScheduleEvent";
import {stopScheduleEvent} from "../dbActions/stopScheduleEvent";
import {changePayingScheduleEvent} from "../dbActions/changePlayingEvent";
import { getActiveScheduleConfig } from "../dbActions/getActiveScheduleConfig";
import {getNextScheduleEventAfter} from "../dbActions/getNextScheduleEventAfter";

export default class ScheduleConfigController {

    public static async getScheduleConfig(): Promise<any> {
        return getLatestScheduleConfig()
    }

    public static async activateScheduleConfig(id: number): Promise<any> {
        try {
            await activateScheduleConfig(id)
            return true
        } catch (err) {
            return { status: 'err' }
        }
    }

    public static async playScheduleEvent(scheduleConfigId: number, scheduleEventId: number, scheduleId: number): Promise<any> {
        try {
            const scheduleConfig = await playScheduleEvent(scheduleConfigId, scheduleEventId, scheduleId) as ScheduleConfig
            const scheduleEvent = await getScheduleEventById(scheduleEventId) as ScheduleEvent
            Promise.all([scheduleConfig, scheduleEvent])
                .then((res: [scheduleConfig: ScheduleConfig, scheduleEvent: ScheduleEvent]) => {
                    CounterActionController.handleCounterAction('tick', res[0], res[1])
                })
            return scheduleConfig
        } catch (err) {
            return { status: 'err' }
        }
    }

    public static async pauseScheduleEvent(scheduleConfigId: number, scheduleEventId: number, scheduleId: number): Promise<any> {
        try {
            const scheduleConfig = await pauseScheduleEvent(scheduleConfigId, scheduleEventId, scheduleId) as ScheduleConfig
            const scheduleEvent = await getScheduleEventById(scheduleEventId) as ScheduleEvent
            Promise.all([scheduleConfig, scheduleEvent])
                .then((res: [scheduleConfig: ScheduleConfig, scheduleEvent: ScheduleEvent]) => {
                    CounterActionController.handleCounterAction('pause', res[0], res[1])
                })
            return scheduleConfig
        } catch (err) {
            return { status: 'err' }
        }
    }

    public static async resumeScheduleEvent(scheduleConfigId: number, scheduleEventId: number, scheduleId: number): Promise<any> {
        try {
            const scheduleConfig = await resumeScheduleEvent(scheduleConfigId, scheduleEventId, scheduleId) as ScheduleConfig
            const scheduleEvent = await getScheduleEventById(scheduleEventId) as ScheduleEvent
            Promise.all([scheduleConfig, scheduleEvent])
                .then((res: [scheduleConfig: ScheduleConfig, scheduleEvent: ScheduleEvent]) => {
                    CounterActionController.handleCounterAction('tick', res[0], res[1])
                })
            return scheduleConfig
        } catch (err) {
            return { status: err }
        }
    }

    public static async stopScheduleEvent(scheduleConfigId: number, scheduleEventId: number, scheduleId: number): Promise<any> {
        try {
            const scheduleConfig = await stopScheduleEvent(scheduleConfigId, scheduleEventId, scheduleId) as ScheduleConfig
            const scheduleEvent = await getScheduleEventById(scheduleEventId) as ScheduleEvent
            Promise.all([scheduleConfig, scheduleEvent])
                .then((res: [scheduleConfig: ScheduleConfig, scheduleEvent: ScheduleEvent]) => {
                    CounterActionController.handleCounterAction('stop', res[0], res[1])
                })
            return scheduleConfig
        } catch (err) {
            return { status: 'err' }
        }
    }

    public static async changePlayingEvent(scheduleConfigId: number, scheduleEventId: number, scheduleId: number): Promise<any> {
        try {
            const scheduleConfig = await changePayingScheduleEvent(scheduleConfigId, scheduleEventId, scheduleId) as ScheduleConfig
            const scheduleEvent = await getScheduleEventById(scheduleEventId) as ScheduleEvent
            Promise.all([scheduleConfig, scheduleEvent])
                .then((res: [scheduleConfig: ScheduleConfig, scheduleEvent: ScheduleEvent]) => {
                    CounterActionController.handleCounterAction('changePlayingEvent', res[0], res[1])
                })
            return scheduleConfig
        } catch (err) {
            return { status: 'err' }
        }
    }

    public static async stopActiveScheduleEvent () {
        try {
            await getActiveScheduleConfig().then((scheduleConfig: ScheduleConfig) => {
                stopScheduleEvent(scheduleConfig.id, scheduleConfig.scheduleEvent_id, scheduleConfig.schedule_id)
                .then(() => {
                    CounterActionController.resetTimerIdAndCounter()
                })
                
            })
        } catch (err) {
            return { status: 'err' }
        }
    }
    

    public static async stopEventAndGetNext () {
        try {
            return await getActiveScheduleConfig().then((scheduleConfig: ScheduleConfig) => {
                return stopScheduleEvent(scheduleConfig.id, scheduleConfig.scheduleEvent_id, scheduleConfig.schedule_id).then((updatedConfig: any) => {
                    return getScheduleEventById(scheduleConfig.scheduleEvent_id).then((endedEvent: any) => {
                        return getNextScheduleEventAfter(endedEvent).then((nextEvent: any) => {
                            return {
                                endedEvent: endedEvent?.id,
                                nextEvent: nextEvent?.id,
                                schedule_id: scheduleConfig.schedule_id,
                                updatedConfig: updatedConfig
                            }
                        })
                    })
                })
            })
        } catch (err) {
            return { status: err }
        }
    }

    public static async getScheduleConfigById(id: number): Promise<any> {
        try {
            return await getScheduleConfigById(id)
        } catch (err) {
            return { status: 'err' }
        }
    }
}
