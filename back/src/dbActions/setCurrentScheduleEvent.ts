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
              // counterIsPaused: false,
          },
      rejectOnEmpty: true
  }).then( async (scheduleConfig: ScheduleConfig) => {
    dd('part 2')
      if (scheduleConfig) {
        const hash = getHash(Math.floor(Math.random() * 10), new Date().getTime())
        await scheduleConfig.update({
            // schedule_id: scheduleId,
            scheduleEvent_id: scheduleEventId,
            // counterIsPaused: true,
            // counterTimePassed: 0,
            hash: hash,
            // scheduleHash: hash,
            // scheduleEventsHash: hash
        })
      }
      return scheduleConfig
  })
  // console.log(result)
  return result
}