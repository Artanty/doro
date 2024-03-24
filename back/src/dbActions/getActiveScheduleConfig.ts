import {ScheduleConfig} from "../models/ScheduleConfig";

export async function getActiveScheduleConfig (): Promise<ScheduleConfig> {
    return await ScheduleConfig.findOne({
      where: {
        configIsActive: true
      },
      rejectOnEmpty: true
    })
}