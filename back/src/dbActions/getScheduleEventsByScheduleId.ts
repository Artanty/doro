import {ScheduleConfig} from "../models/ScheduleConfig";
import {Schedule} from "../models/Schedule";
import {ScheduleEvent} from "../models/ScheduleEvent";

export async function getScheduleEventsByScheduleId (id: number) {
    return await ScheduleEvent.findAll({
        where: {
            schedule_id: id,
        },
    });
}
