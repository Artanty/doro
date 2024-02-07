import {ScheduleConfig} from "../models/ScheduleConfig";

export async function getLatestScheduleConfig () {
    return await ScheduleConfig.findOne({
        order: [
            ['createdAt', 'DESC'],
            ['updatedAt', 'DESC'],
        ]
    })
}