import {ScheduleConfig} from "../models/ScheduleConfig";
import {ScheduleEvent} from "../models/ScheduleEvent";
import {getScheduleConfigById} from "./getScheduleConfigById";
import {dd, getHash} from "../utils";

export async function updateScheduleConfigHash (
  scheduleConfig: ScheduleConfig, hashName: string): Promise<ScheduleConfig> {
  const hash = getHash(Math.floor(Math.random() * 10), new Date().getTime())
  if (hashName === 'hash') {
    return await scheduleConfig.update({
      scheduleEventsHash: hash
    })
  } else if (hashName === 'scheduleHash') {
    return await scheduleConfig.update({
      scheduleEventsHash: hash
    })
  } else { // (hashName === 'scheduleEventsHash')
    return await scheduleConfig.update({
      scheduleEventsHash: hash
    })
  }
}