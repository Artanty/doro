import { Schedule } from "../models/Schedule";

export async function createSchedule (name: string, scheduleType: string): Promise<Schedule> {
    return await Schedule.build({
        name,
        scheduleType,
    }).save()
}
