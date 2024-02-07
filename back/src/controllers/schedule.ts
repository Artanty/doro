import {getLatestScheduleConfig} from "../dbActions/getLatestScheduleConfig";
import {ScheduleConfig} from "../models/ScheduleConfig";
import {saveDefaultScheduleConfig} from "../dbActions/saveDefaultScheduleConfig";
import {getScheduleById} from "../dbActions/getSchedule";

export default class ScheduleController {
    public async getSchedule(id: number): Promise<any> {
        try {
            return getScheduleById(id)
        } catch (err) {
            return { status: 'err' }
        }
    }
}