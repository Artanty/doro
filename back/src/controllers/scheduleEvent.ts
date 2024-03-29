import {getLatestScheduleConfig} from "../dbActions/getLatestScheduleConfig";
import {ScheduleConfig} from "../models/ScheduleConfig";
import {saveDefaultScheduleConfig} from "../dbActions/saveDefaultScheduleConfig";
import {getScheduleById} from "../dbActions/getSchedule";
import {getScheduleEventsByScheduleId} from "../dbActions/getScheduleEventsByScheduleId";
import {createScheduleEvent} from "../dbActions/createScheduleEvent";
import {deleteScheduleEvent} from "../dbActions/deleteScheduleEvent";
import ScheduleConfigController from "./scheduleConfigController";
import {
    getNextScheduleEventAfter
} from "../dbActions/getNextScheduleEventAfter"
import {getScheduleEventById} from "../dbActions/getScheduleEventById";
import {ScheduleEvent} from "../models/ScheduleEvent";
import { stopScheduleEvent } from "../dbActions/stopScheduleEvent";
import CounterActionController from "./counterAction";
import { deleteScheduleEventById } from "../dbActions/deleteScheduleEventById";
import { getScheduleConfigById } from "../dbActions/getScheduleConfigById";
import { createDefaultScheduleEvents } from "../dbActions/createDefaultScheduleEvents";
import { createSchedule } from "../dbActions/createSchedule";
import { Schedule } from "../models/Schedule";
import { createScheduleEvents } from "../dbActions/createScheduleEvents";
import { setCurrentSchedule } from "../dbActions/setCurrentSchedule";
import { dd } from "../utils";
import { getActiveScheduleConfig } from "../dbActions/getActiveScheduleConfig";
import { updateScheduleConfigHash } from "../dbActions/updateScheduleConfigHash";


export default class ScheduleEventController {
    public static async getScheduleEventsByScheduleId(id: number): Promise<any> {
        try {
            return await getScheduleEventsByScheduleId(id)
        } catch (err) {
            return { status: 'err' }
        }
    }
    public static async createScheduleEvent(data: any): Promise<any> {
        try {
            return await createScheduleEvent(data)
        } catch (err) {
            return { status: 'err' }
        }
    }

    // scheduleEvent: IScheduleEvent, scheduleConfigId: number
    public static async deleteScheduleEvent(data: any): Promise<any> {
        try {
            let configWithStoppedEvent: ScheduleConfig | null = null
            /**
             * get config
             * if config has eventId
             * stop it
             * stop timer + send SSE
             */
            const scheduleConfig = await getScheduleConfigById(data.scheduleConfigId)
            if (scheduleConfig?.scheduleEvent_id === data.scheduleEvent.id) {
                configWithStoppedEvent = await stopScheduleEvent(
                    data.scheduleConfigId, 
                    data.scheduleEvent.id, 
                    data.scheduleEvent.schedule_id) 
                CounterActionController.handleCounterAction('stop', configWithStoppedEvent, data.scheduleEvent)
            }
          
            return await deleteScheduleEventById(data.scheduleEvent.id)
                .then(async(deleteRes: any) => {
                    const configWithUpdatedHash = await updateScheduleConfigHash((configWithStoppedEvent || scheduleConfig) as any, 'scheduleEventsHash')
                    CounterActionController.broadcastConfig(configWithUpdatedHash)
                    return { status: {
                        eventStopped: !!configWithStoppedEvent,
                        eventDeleted: !!deleteRes
                    } }
                })
        } catch (err) {
            return { status: 'err' }
        }
    }

    public static async createDefaultEventsAndPlay (data: any): Promise<any> {
        try {
            if (data.scheduleId) {
                await createDefaultScheduleEvents(data.scheduleId, [])
                return { status: 'createDefaultScheduleEvents ok' }
            } else {
                await getActiveScheduleConfig().then( async(scheduleConfig: ScheduleConfig) => {
                    if (scheduleConfig.scheduleEvent_id) {
                        await createDefaultScheduleEvents(scheduleConfig.scheduleEvent_id, [])
                        return { status: 'createDefaultScheduleEvents ok' }  
                    } else {
                        await createSchedule('Таймер по умолчанию', 'default').then(async(schedule: Schedule) => {
                            await createDefaultScheduleEvents(schedule.id, [])
                            return { status: 'createSchedule ok' } 
                        })
                    }
                })
                return { status: 'ok' }
            }
        } catch (err) {
            return { status: 'err' }
        }
    }

    public static async createScheduleWithEvents(data: any): Promise<any> {
        try {
            return await createSchedule(data.schedule.name, data.schedule.scheduleType)
            .then( async(schedule: Schedule) => {
                dd('createSchedule done')
                return await createScheduleEvents(schedule.id, data.events).then( async (events) => {
                    dd('createScheduleEvents done')
                    return await setCurrentSchedule(data.scheduleConfigId, events[0]?.id, schedule.id)
                    .then((scheduleConfig: ScheduleConfig) => {
                        dd('setCurrentSchedule done')
                        CounterActionController.broadcastConfig(scheduleConfig, true)
                        return {
                            status: scheduleConfig.id
                        }
                    })
                })
                
            })
        } catch (err) {
            return { status: 'err' }
        }
    }

}
