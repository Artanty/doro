import {ScheduleConfig} from "../models/ScheduleConfig";
import {ScheduleEvent} from "../models/ScheduleEvent";
import {getScheduleConfigById} from "./getScheduleConfigById";
import {dd, getHash} from "../utils";
import { getActiveScheduleConfig } from "./getActiveScheduleConfig";

export async function updateScheduleConfigHash (
  scheduleConfig?: ScheduleConfig, hashName?: string): Promise<ScheduleConfig> {
  
  if (scheduleConfig) {
    return await updateHash(scheduleConfig, hashName)
  } else {
    const activeConfig = await getActiveScheduleConfig()
    return await updateHash(activeConfig, hashName)
  }
}

async function updateHash (scheduleConfig: ScheduleConfig, hashName?: string) {
  const hash = getHash(Math.floor(Math.random() * 10), new Date().getTime())
  if (hashName === 'hash') {
    return await scheduleConfig.update({
      hash: hash
    })
  } else if (hashName === 'scheduleHash') {
    return await scheduleConfig.update({
      scheduleHash: hash
    })
  } else { // (hashName === 'scheduleEventsHash')
    return await scheduleConfig.update({
      scheduleEventsHash: hash
    })
  }
}