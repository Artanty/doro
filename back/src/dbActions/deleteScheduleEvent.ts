import {ScheduleEvent} from "../models/ScheduleEvent";

export async function deleteScheduleEvent (data: any) {
    return await ScheduleEvent.destroy({
        where: {
            id: data.id
        }
    });
}
