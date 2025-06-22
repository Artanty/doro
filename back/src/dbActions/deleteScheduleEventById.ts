import {ScheduleEvent} from "../models/ScheduleEvent";
import { dd } from "../utils";

export async function deleteScheduleEventById (id: number): Promise<number> {
    dd('id to delete: ' + id)
    return await ScheduleEvent.destroy({
        where: {
            id: id
        },
    });
}
