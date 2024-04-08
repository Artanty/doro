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