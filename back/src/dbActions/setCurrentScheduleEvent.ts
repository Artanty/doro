import { ScheduleConfig } from "../models/ScheduleConfig"
import { dd, getHash } from "../utils"

export async function setCurrentScheduleEvent (
  scheduleConfigId: number,
  scheduleId: number,
  scheduleEventId: number,
  ): Promise<ScheduleConfig> {
  const result = await ScheduleConfig.findOne({
      where:
          {
              configIsActive: true,
              schedule_id: scheduleId,
              id: scheduleConfigId,
          },
      rejectOnEmpty: true
  }).then( async (scheduleConfig: ScheduleConfig) => {
      if (scheduleConfig) {
        const hash = getHash(Math.floor(Math.random() * 10), new Date().getTime())
        await scheduleConfig.update({
            scheduleEvent_id: scheduleEventId,
            hash: hash,
        })
      }
      return scheduleConfig
  })
  return result
}