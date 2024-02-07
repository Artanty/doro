import {
  Inject,
  Injectable
} from '@angular/core';
import {StoreService} from "./store.service";
import {
  EMPTY,
  filter,
  map,
  pipe,
  switchMap,
  take,
  zip
} from "rxjs";
import {HttpClient} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class CounterService {

  constructor(
    @Inject(StoreService) private Store: StoreService,
    @Inject(HttpClient) private http: HttpClient
  ) { }

  scheduleConfigActivator () {
    zip(this.Store.listenScheduleConfig(), this.Store.listenSchedule(), this.Store.listenScheduleEvents())
      .pipe(
        filter(([scheduleConfig, value2, value3]) =>
          scheduleConfig && scheduleConfig.id !== undefined &&
          value2 && value2.id !== undefined &&
          Array.isArray(value3) && value3?.[0]?.id !== undefined
        ),
        take(1),
        map(res => res?.[0]),
        switchMap((scheduleConfig: any) => {
          if (scheduleConfig.configIsActive === false) {
            return this.http.post('http://localhost:3000/scheduleConfig/activate', { scheduleConfigId: scheduleConfig.id })
          } else {
            return EMPTY
          }
        })
      )
      .subscribe((res: any) => {
        console.log(res)
      })


  }

  onReceiveScheduleConfig (data: any) {
    this.Store.setScheduleConfig(data)
    console.log(this.Store.getScheduleConfig())
  }

  onReceiveSchedule (data: any) {
    this.Store.setSchedule(data)
    console.log(this.Store.getSchedule())
  }

  onReceiveScheduleEvents (data: any) {
    this.Store.setScheduleEvents(data)
    console.log(this.Store.getScheduleEvents())
  }

  startEvent (eventId: number) {
    this.http.post('http://localhost:3000/scheduleConfig/playEvent', {
      scheduleEventId: eventId,
      scheduleConfigId: this.Store.getScheduleConfig()?.id,
      scheduleId: this.Store.getSchedule()?.id
    })
      .subscribe((res: any) => {
        console.log(res)
        const event = this.Store.getScheduleEventById(res?.scheduleEvent_id)
        this.Store.setCurrentScheduleEvent(event)
      })
  }

  stopEvent (eventId: number) {
    this.http.post('http://localhost:3000/scheduleConfig/stopEvent', {
      scheduleEventId: eventId,
      scheduleConfigId: this.Store.getScheduleConfig()?.id,
      scheduleId: this.Store.getSchedule()?.id
    })
      .subscribe((res: any) => {
        console.log(res)
      })
  }
  pauseEvent (eventId: number) {
    this.http.post('http://localhost:3000/scheduleConfig/pauseEvent', {
      scheduleEventId: eventId,
      scheduleConfigId: this.Store.getScheduleConfig()?.id,
      scheduleId: this.Store.getSchedule()?.id
    })
      .subscribe((res: any) => {
        console.log(res)

      })
  }
  resumeEvent (eventId: number) {
    this.http.post('http://localhost:3000/scheduleConfig/resumeEvent', {
      scheduleEventId: eventId,
      scheduleConfigId: this.Store.getScheduleConfig()?.id,
      scheduleId: this.Store.getSchedule()?.id
    })
      .subscribe((res: any) => {
        console.log(res)
      })
  }
  changePlayingEvent (eventId: number) {
    this.http.post('http://localhost:3000/scheduleConfig/changePlayingEvent', {
      scheduleEventId: eventId,
      scheduleConfigId: this.Store.getScheduleConfig()?.id,
      scheduleId: this.Store.getSchedule()?.id
    })
      .subscribe((res: any) => {
        console.log(res)
        const event = this.Store.getScheduleEventById(res?.scheduleEvent_id)
        this.Store.setCurrentScheduleEvent(event)
      })
  }

  getActiveScheduleEvent () {
    const eventId = this.Store.getScheduleConfig()?.scheduleEvent_id
    return this.Store.getScheduleEventById(eventId)
  }
}
