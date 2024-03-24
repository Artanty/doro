import {ScheduleEvent} from "../models/ScheduleEvent";

export async function deleteScheduleEventById (id: number): Promise<number> {
    return await ScheduleEvent.destroy({
        where: {
            id: id
        },
    });
}
