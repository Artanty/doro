import {ScheduleConfig} from "../models/ScheduleConfig";
import {Schedule} from "../models/Schedule";
import {ScheduleEvent} from "../models/ScheduleEvent";

export async function getScheduleConfigById (id: number) {
    return await ScheduleConfig.findByPk(id)
}