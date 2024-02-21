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

    //  todo: add checks
    public static async deleteScheduleEvent(data: any): Promise<any> {
        try {
            const res = await deleteScheduleEvent(data)
            return { status: res }
        } catch (err) {
            return { status: 'err' }
        }
    }

}
