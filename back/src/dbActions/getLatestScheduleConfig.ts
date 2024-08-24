import {ScheduleConfig} from "../models/ScheduleConfig";

export async function getLatestScheduleConfig () {

    const scheduleConfig = await ScheduleConfig.findOne({
        order: [
            ['createdAt', 'DESC'],
            ['updatedAt', 'DESC'],
        ]
    })

    if (!scheduleConfig) {
        throw new Error(`ScheduleConfig not found`);
    }

    return scheduleConfig;
}