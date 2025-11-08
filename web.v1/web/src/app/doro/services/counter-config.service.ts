import { Injectable } from '@angular/core';
import {IScheduleEvent} from "../models/scheduleEvent.model";
import { ICounterPeriodConfig } from '../widgets/counter-config/counter-config.component';
import { add, startOfToday } from 'date-fns';

export interface IWorkSimpleCounterConfig {
  scheduleName: string;
  scheduleDate: string;
  periods: [
    {
      workName: string
      restName: string
      periodStart: string;
      periodEnd: string;
      workLength: number;
      restLength: number;
      bigRestLength: number;
      bigRestRate: number;
      scheduleType: string;
    }
  ]

}

export type TEventType = 'work' | 'rest'

@Injectable({
  providedIn: 'root'
})
export class CounterConfigService {

  constructor() { }
  getScheduleFromConfig (config: ICounterPeriodConfig) {
    return {
      name: config.scheduleName,
      scheduleType: config.scheduleType
    }
  }
  /**
   * Ограничения:
   * event - не больше часа, измеряется в минутах
   */
  getEventsFromConfig (config: ICounterPeriodConfig) {
    const startHHMM = config.periodStart.split(':')
    const periodStart = add(startOfToday(), { hours: +startHHMM[0], minutes: +startHHMM[1] })
    const endHHMM = config.periodEnd.split(':')
    const periodEnd = add(startOfToday(), { hours: +endHHMM[0], minutes: +endHHMM[1] })
    const resultEvents: any[] = []
    let currentStartTime = periodStart
    while (currentStartTime < periodEnd) {
      const currentEventType = this.getCurrentEventType(resultEvents)
      const currentEventLength = this.getEventLength(
          resultEvents.length + 1,
          currentEventType,
          config.workLength,
          config.restLength,
          config.bigRestLength,
          config.bigRestRate
        )
      const currentEndTime = add(currentStartTime, { minutes: currentEventLength })
      const newScheduleEvent = {
        timeFrom: currentStartTime.toISOString(),
        timeTo: currentEndTime.toISOString(),
        eventType: currentEventType,
        name: currentEventType === 'work' ? config.workName : config.restName
      }
      currentStartTime = currentEndTime
      if (currentEndTime <= periodEnd) {
        resultEvents.push(newScheduleEvent)
      }
    }
    return resultEvents
  }

  private getCurrentEventType (resultEvents: any[], workIsFirst: boolean = true): TEventType {
    if (resultEvents.length === 0) {
      return workIsFirst ? 'work' : 'rest'
    }
    return resultEvents[resultEvents.length - 1]?.eventType === 'work' ? 'rest' : 'work'
  }

  private getEventLength (
      i: number,
      eventType: TEventType,
      workLength: number,
      restLength: number,
      bigRestLength: number = 0,
      bigRestRate: number = 0
    ): number {
    if (eventType === 'work') {
      return workLength
    } else {
      if (restLength === bigRestLength) {
        return restLength
      }
      return this.isBigRest(i, bigRestRate) ? bigRestLength : restLength
    }
  }

  private isBigRest (currentIteration: number, bigRestRate: number = 0): boolean {
    if (bigRestRate !== 0) {
      if (bigRestRate === 1) {
        return true
      } else {
        return currentIteration % bigRestRate === 0
      }
    } else {
      return false
    }
  }
}
