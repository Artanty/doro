import {ScheduleConfig} from "../models/ScheduleConfig";

export async function getActiveScheduleConfig (): Promise<ScheduleConfig> {
  console.log(' getActiveScheduleConfig ()')
    return await ScheduleConfig.findOne({
      where: {
        configIsActive: true
      },
      rejectOnEmpty: true
    })
}