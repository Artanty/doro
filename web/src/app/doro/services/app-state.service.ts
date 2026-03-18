import { Injectable } from "@angular/core";
import { obs$ } from "../helpers/observable-variable";
import { Nullable } from "../helpers/utility.types";
import { EventProps, Schedule } from "./event/event.types";

@Injectable({
  providedIn: 'root'
})
export class AppStateService {
  public events = obs$<EventProps[]>([]);
  public configHash = obs$<number>(0);
  public recentEvent = obs$<Nullable<number>>(null);
  
  public currentSchedule = obs$<Nullable<Schedule>>(null);
  public staticEventsState$ = obs$<Record<number, number>>({});

  public lastAutoRedirect = obs$<string>('');
  
}