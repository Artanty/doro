import {getLatestScheduleConfig} from "../dbActions/getLatestScheduleConfig";
import {ScheduleConfig} from "../models/ScheduleConfig";
import {saveDefaultScheduleConfig} from "../dbActions/saveDefaultScheduleConfig";
import {getScheduleById} from "../dbActions/getSchedule";
import {getScheduleEventByScheduleId} from "../dbActions/getScheduleEventByScheduleId";
import {createScheduleEvent} from "../dbActions/createScheduleEvent";

export default class ScheduleEventController {
    public async getScheduleEventByScheduleId(id: number): Promise<any> {
        try {
            return getScheduleEventByScheduleId(id)
        } catch (err) {
            return { status: 'err' }
        }
    }
    public async createScheduleEvent(data: any): Promise<any> {
        try {
            return createScheduleEvent(data)
        } catch (err) {
            return { status: 'err' }
        }
    }

}
