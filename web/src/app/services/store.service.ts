import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  Observable
} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class StoreService {
  private scheduleConfig$: BehaviorSubject<any> = new BehaviorSubject(null)
  private schedule$: BehaviorSubject<any> = new BehaviorSubject(null)
  private scheduleEvents$: BehaviorSubject<any> = new BehaviorSubject(null)
  // private selectedScheduleEvent$: BehaviorSubject<any> = new BehaviorSubject(null)
  private currentScheduleEvent$: BehaviorSubject<any> = new BehaviorSubject(null)
  constructor() {
    console.log('Store created')
  }

  public setScheduleConfig (data: any) {
    this.scheduleConfig$.next(data)
  }
  public getScheduleConfig ():  any {
    return this.scheduleConfig$.value
  }
  public listenScheduleConfig (): Observable<any> {
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

  public setScheduleEvents (data: any[]) {
    this.scheduleEvents$.next(data)
  }
  public getScheduleEvents (): any[] {
    return this.scheduleEvents$.value
  }
  public getScheduleEventById (id: number): any {
    return this.scheduleEvents$.value?.find((el: any)=>el.id === id)
  }
  public listenScheduleEvents () {
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


}
