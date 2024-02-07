import {getLatestScheduleConfig} from "../dbActions/getLatestScheduleConfig";
import {ScheduleConfig} from "../models/ScheduleConfig";
import {saveDefaultScheduleConfig} from "../dbActions/saveDefaultScheduleConfig";
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

export default class ScheduleConfigController {

    public async getScheduleConfig(): Promise<any> {
        try {
            return getLatestScheduleConfig().then((latestConfig: ScheduleConfig | null) => {
                if (latestConfig) {
                    return latestConfig
                } else {
                    return saveDefaultScheduleConfig()
                }
            })
        } catch (err) {
            return { status: 'err' }
        }
    }

    public async activateScheduleConfig(id: number): Promise<any> {
        try {
            await activateScheduleConfig(id)
            return true
        } catch (err) {
            return { status: 'err' }
        }
    }

    public async playScheduleEvent(scheduleConfigId: number, scheduleEventId: number, scheduleId: number): Promise<any> {
        try {
            const scheduleConfig = await playScheduleEvent(scheduleConfigId, scheduleEventId, scheduleId) as ScheduleConfig
            const scheduleEvent = await getScheduleEventById(scheduleEventId) as ScheduleEvent
            Promise.all([scheduleConfig, scheduleEvent])
                .then((res: [scheduleConfig: ScheduleConfig, scheduleEvent: ScheduleEvent]) => {
                    CounterActionController.handleCounterAction(res[0], res[1], 'tick')
                })
            // console.log(rr?.counterStartTime)
            return scheduleConfig
        } catch (err) {
            return { status: 'err' }
        }
    }

    public async pauseScheduleEvent(scheduleConfigId: number, scheduleEventId: number, scheduleId: number): Promise<any> {
        try {
            const scheduleConfig = await pauseScheduleEvent(scheduleConfigId, scheduleEventId, scheduleId) as ScheduleConfig
            const scheduleEvent = await getScheduleEventById(scheduleEventId) as ScheduleEvent
            Promise.all([scheduleConfig, scheduleEvent])
                .then((res: [scheduleConfig: ScheduleConfig, scheduleEvent: ScheduleEvent]) => {
                    CounterActionController.handleCounterAction(res[0], res[1], 'pause')
                })
            // console.log(rr?.counterStartTime)
            return scheduleConfig
        } catch (err) {
            return { status: 'err' }
        }
    }

    public async resumeScheduleEvent(scheduleConfigId: number, scheduleEventId: number, scheduleId: number): Promise<any> {
        try {
            const scheduleConfig = await resumeScheduleEvent(scheduleConfigId, scheduleEventId, scheduleId) as ScheduleConfig
            const scheduleEvent = await getScheduleEventById(scheduleEventId) as ScheduleEvent
            Promise.all([scheduleConfig, scheduleEvent])
                .then((res: [scheduleConfig: ScheduleConfig, scheduleEvent: ScheduleEvent]) => {
                    CounterActionController.handleCounterAction(res[0], res[1], 'tick')
                })
            // console.log(rr?.counterStartTime)
            return scheduleConfig
        } catch (err) {
            return { status: 'err' }
        }
    }

    public async stopScheduleEvent(scheduleConfigId: number, scheduleEventId: number, scheduleId: number): Promise<any> {
        try {
            const scheduleConfig = await stopScheduleEvent(scheduleConfigId, scheduleEventId, scheduleId) as ScheduleConfig
            const scheduleEvent = await getScheduleEventById(scheduleEventId) as ScheduleEvent
            Promise.all([scheduleConfig, scheduleEvent])
                .then((res: [scheduleConfig: ScheduleConfig, scheduleEvent: ScheduleEvent]) => {
                    CounterActionController.handleCounterAction(res[0], res[1], 'stop')
                })
            return scheduleConfig
        } catch (err) {
            return { status: 'err' }
        }
    }

    public async changePlayingEvent(scheduleConfigId: number, scheduleEventId: number, scheduleId: number): Promise<any> {
        try {
            const scheduleConfig = await changePayingScheduleEvent(scheduleConfigId, scheduleEventId, scheduleId) as ScheduleConfig
            const scheduleEvent = await getScheduleEventById(scheduleEventId) as ScheduleEvent
            Promise.all([scheduleConfig, scheduleEvent])
                .then((res: [scheduleConfig: ScheduleConfig, scheduleEvent: ScheduleEvent]) => {
                    CounterActionController.handleCounterAction(res[0], res[1], 'changePlayingEvent')
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
    




}