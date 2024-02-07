import {ScheduleConfig} from "../models/ScheduleConfig";
import {Schedule} from "../models/Schedule";

export async function getScheduleById (id: number) {
    return await Schedule.findByPk(id)
}