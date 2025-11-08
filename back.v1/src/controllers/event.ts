import {getScheduleById} from "../dbActions/getSchedule";

export default class EventController {
    public async playEvent(id: number): Promise<any> {
        try {
            return getScheduleById(id)
        } catch (err) {
            return { status: 'err' }
        }
    }
}