import {ScheduleEvent} from "../models/ScheduleEvent";

export async function deleteScheduleEventById (id: number) {
    return await ScheduleEvent.destroy({
        where: {
            id: id
        }
    });
}
