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

import {SERVER_URL} from "../../../../env";
import {
  IEndEventSseResponse,
  ISuggestNextEventSseResponse
} from "../../../../../contracts/endEventSseResponse";

@Injectable({
  providedIn: 'root'
})
export class CounterService {

  constructor(
    @Inject(StoreService) private StoreServ: StoreService,
    @Inject(HttpClient) private http: HttpClient
  ) { }

  scheduleConfigActivator () {
    zip(this.StoreServ.listenScheduleConfig(), this.StoreServ.listenSchedule(), this.StoreServ.listenScheduleEvents())
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
            return this.http.post(`${SERVER_URL}/scheduleConfig/activate`, { scheduleConfigId: scheduleConfig.id })
          } else {
            return EMPTY
          }
        })
      )
      .subscribe((res: any) => {
      })
  }

  startEvent (eventId: number) {
    this.http.post(`${SERVER_URL}/scheduleConfig/playEvent`, {
      scheduleEventId: eventId,
      scheduleConfigId: this.StoreServ.getScheduleConfig()?.id,
      scheduleId: this.StoreServ.getSchedule()?.id
    })
      .subscribe((res: any) => {
        this._resetSuggestNext()
      })
  }

  stopEvent (eventId: number) {
    this.http.post(`${SERVER_URL}/scheduleConfig/stopEvent`, {
      scheduleEventId: eventId,
      scheduleConfigId: this.StoreServ.getScheduleConfig()?.id,
      scheduleId: this.StoreServ.getSchedule()?.id
    })
      .subscribe((res: any) => {
      })
  }
  pauseEvent (eventId: number) {
    this.http.post(`${SERVER_URL}/scheduleConfig/pauseEvent`, {
      scheduleEventId: eventId,
      scheduleConfigId: this.StoreServ.getScheduleConfig()?.id,
      scheduleId: this.StoreServ.getSchedule()?.id
    })
      .subscribe((res: any) => {
      })
  }
  resumeEvent (eventId: number) {
    this.http.post(`${SERVER_URL}/scheduleConfig/resumeEvent`, {
      scheduleEventId: eventId,
      scheduleConfigId: this.StoreServ.getScheduleConfig()?.id,
      scheduleId: this.StoreServ.getSchedule()?.id
    })
      .subscribe((res: any) => {
      })
  }

  changePlayingEvent (eventId: number) {
    this.http.post(`${SERVER_URL}/scheduleConfig/changePlayingEvent`, {
      scheduleEventId: eventId,
      scheduleConfigId: this.StoreServ.getScheduleConfig()?.id,
      scheduleId: this.StoreServ.getSchedule()?.id
    })
      .subscribe((res: any) => {
        this._resetSuggestNext()
      })
  }

  getActiveScheduleEvent () {
    const eventId = this.StoreServ.getScheduleConfig()?.scheduleEvent_id
    return eventId ? (this.StoreServ.getScheduleEventById(eventId) || null) : null
  }
  once = false
  getScheduleConfig() {
    // if (!this.once) {
      // setTimeout(() => {
        this.http.post(`${SERVER_URL}/getScheduleConfig`, null)
          .subscribe((res: any) => {
            this.StoreServ.setScheduleConfig(res)
            // this.once = true
          })
      // }, 1000)
    // }
  }

  public suggestNext (data: ISuggestNextEventSseResponse) {
    this.StoreServ.setSuggestNext([data.endedEvent, data.nextEvent])
  }

  private _resetSuggestNext () {
    this.StoreServ.setSuggestNext(null)
  }
}
