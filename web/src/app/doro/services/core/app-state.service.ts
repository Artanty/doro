import { Injectable } from "@angular/core";
import { obs$ } from "../../helpers/observable-variable";
import { Nullable } from "../../helpers/utility.types";
import { EventProps, Schedule } from "../basic-event/basic-event.types";
import { ScheduleListResDataItem } from "@contracts/schedule.contracts";

@Injectable({
  providedIn: 'root'
})
export class AppStateService {
  public events = obs$<EventProps[]>([]); //GetEventResDataItem
  public schedules = obs$<ScheduleListResDataItem[]>([]);
  
  public configHash = obs$<number>(0, true);
  public configHashSchedules = obs$<number>(0, true);

  public recentEvent = obs$<Nullable<number>>(null, true);
  
  public currentSchedule = obs$<Nullable<Schedule>>(null, true);
  public staticEventsState$ = obs$<Record<number, number>>({}, true);

  public lastAutoRedirect = obs$<string>('', true);
  
}