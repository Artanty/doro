import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  Observable
} from "rxjs";
import { ITick } from '../models/tick.model';
import { Nullable, Undefinable } from '../models/_helper-types';
import { IScheduleConfig } from '../models/scheduleConfig.model';
import { IScheduleEvent } from '../models/scheduleEvent.model';

@Injectable({
  providedIn: 'root'
})
export class StoreService {
  private scheduleConfig$: BehaviorSubject<Nullable<IScheduleConfig>> = new BehaviorSubject<Nullable<IScheduleConfig>>(null)
  private schedule$: BehaviorSubject<any> = new BehaviorSubject(null)
  private scheduleEvents$: BehaviorSubject<IScheduleEvent[]> = new BehaviorSubject<IScheduleEvent[]>([])
  // private selectedScheduleEvent$: BehaviorSubject<any> = new BehaviorSubject(null)
  private currentScheduleEvent$: BehaviorSubject<any> = new BehaviorSubject(null)
  private viewState$: BehaviorSubject<any> = new BehaviorSubject('counter')
  private tick$: BehaviorSubject<Nullable<ITick>> = new BehaviorSubject<Nullable<ITick>>(null)

  constructor() {
    console.log('Store created')
  }

  public setScheduleConfig (data: Nullable<IScheduleConfig>) {
    this.scheduleConfig$.next(data)
  }
  public getScheduleConfig (): Nullable<IScheduleConfig> {
    return this.scheduleConfig$.value
  }
  public listenScheduleConfig (): Observable<Nullable<IScheduleConfig>> {
    return this.scheduleConfig$.asObservable()
  }

  public setSchedule (data: any) {
    this.schedule$.next(data)
  }
  public getSchedule ():  any {
    return this.schedule$.value
  }
  public listenSchedule (): Observable<any> {
    return this.schedule$.asObservable()
  }

  public setScheduleEvents (data: IScheduleEvent[]) {
    this.scheduleEvents$.next(data)
  }
  public getScheduleEvents (): IScheduleEvent[] {
    return this.scheduleEvents$.value
  }
  public getScheduleEventById (id: number): Undefinable<IScheduleEvent> {
    return this.scheduleEvents$.value?.find((el: any)=>el.id === id)
  }
  public listenScheduleEvents (): Observable<IScheduleEvent[]> {
    return this.scheduleEvents$.asObservable()
  }

  // public setSelectedScheduleEvent (data: any) {
  //   this.selectedScheduleEvent$.next(data)
  // }
  // public getSelectedScheduleEvent (): any {
  //   return this.selectedScheduleEvent$.value
  // }
  // public listenSelectedScheduleEvent () {
  //   return this.selectedScheduleEvent$.asObservable()
  // }

  public setCurrentScheduleEvent (data: any) {
    if (JSON.stringify(this.getCurrentScheduleEvent()) !== JSON.stringify(data)) {
      this.currentScheduleEvent$.next(data)
    }
  }
  public getCurrentScheduleEvent (): any {
    return this.currentScheduleEvent$.value
  }
  public listenCurrentScheduleEvent () {
    return this.currentScheduleEvent$.asObservable()
  }

  public setViewState (data: any) {
    this.viewState$.next(data)
  }
  public getViewState ():  any {
    return this.viewState$.value
  }
  public listenViewState (): Observable<any> {
    return this.viewState$.asObservable()
  }

  public setTick (data: Nullable<ITick>) {
    this.tick$.next(data)
  }
  public getTick (): Nullable<ITick> {
    return this.tick$.value
  }
  public listenTick (): Observable<Nullable<ITick>> {
    return this.tick$.asObservable()
  }

}
