import { Injectable } from '@angular/core';
import {IScheduleEvent} from "../models/scheduleEvent.model";

interface IWorkPeriodCounterConfig {
  scheduleName: string;
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

@Injectable({
  providedIn: 'root'
})
export class CounterConfigService {

  constructor() { }

  fromCounterConfigToEventList (data: IWorkPeriodCounterConfig): any | IScheduleEvent[] {

  }
}
