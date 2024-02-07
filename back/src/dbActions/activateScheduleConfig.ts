import {ScheduleConfig} from "../models/ScheduleConfig";

export async function activateScheduleConfig (scheduleConfigId: number) {
    return await ScheduleConfig.update({ configIsActive: true }, { where: { id: scheduleConfigId } })
}
