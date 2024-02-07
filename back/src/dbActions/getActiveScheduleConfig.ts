import {ScheduleConfig} from "../models/ScheduleConfig";

export async function getActiveScheduleConfig () {
    return await ScheduleConfig.findOne({
      where: {
        configIsActive: true
      },
      rejectOnEmpty: true
    })
}