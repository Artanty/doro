import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { obs$ } from '../utilites/observable-variable';
import { BusEvent } from 'typlib';
import { Nullable } from '../utilites/utility.types';
import { Schedule } from '../components/event/event.types';


@Injectable({
  providedIn: 'root'
})
export class AppStateService {
  public configHash = obs$<number>(0);
  public recentEvent = obs$<Nullable<number>>(null);
  // public recentSchedule = obs$<Nullable<Schedule>>(null);
  // public sessionSchedule = obs$<Nullable<Schedule>>(null);
  public currentSchedule = obs$<Nullable<Schedule>>(null);
  public staticEventsState$ = obs$<Record<number, number>>({});
  /**
   * При загрузке - берем недавний
   * При работе - сохраненный
   * */
  // public getActualSchedule(): Observable<Schedule> {
  //   if (this.sessionSchedule.value) {
  //     return this.sessionSchedule.listenReq;
  //   }
    
  //   return this.recentSchedule.listenReq;
  // }
  // public userAction = obs$<Nullable<UserAction>>(null)
  // public isLoggedIn = obs$<boolean>(false)
  // public userProfile = obs$<Nullable<UserData>>(null)
  // public view = obs$<Nullable<ViewState>>(null) //todo reset on view change
  // public authConfig = obs$<Nullable<IAuthDto>>(null)
  // public lastRoute = obs$<string>('/') // todo get host home route
}