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
                    data.scheduleEvent.schedule_id) as ScheduleConfig
                CounterActionController.handleCounterAction(configWithStoppedEvent, data.scheduleEvent, 'stop')
            }
          
            return await deleteScheduleEventById(data.scheduleEvent.id)
                .then((deleteRes: any) => {
                    return { status: {
                        eventStopped: !!configWithStoppedEvent,
                        eventDeleted: !!deleteRes
                    } }
                })
        } catch (err) {
            return { status: 'err' }
        }
    }

}
