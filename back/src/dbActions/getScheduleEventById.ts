import {ScheduleConfig} from "../models/ScheduleConfig";
import {Schedule} from "../models/Schedule";
import {ScheduleEvent} from "../models/ScheduleEvent";

export async function getScheduleEventById (id: number) {
    return await ScheduleEvent.findByPk(id)
}