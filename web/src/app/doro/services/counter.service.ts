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
import {
  fetchDataSequentially,
  TEndpointsWithDepsResponse
} from "../helpers/fetchDataSequentially";
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
        console.log(res)
      })


  }

  onReceiveScheduleConfig (data: any) {
    this.StoreServ.setScheduleConfig(data)
    // console.log(this.StoreServ.getScheduleConfig())
  }

  onReceiveSchedule (data: any) {
    this.StoreServ.setSchedule(data)
    // console.log(this.StoreServ.getSchedule())
  }

  onReceiveScheduleEvents (data: any) {
    this.StoreServ.setScheduleEvents(data)
    if (data.length) {
      this.StoreServ.setCurrentScheduleEvent(this.getActiveScheduleEvent())
    }
    // console.log(this.StoreServ.getScheduleEvents())
  }

  startEvent (eventId: number) {
    this.http.post(`${SERVER_URL}/scheduleConfig/playEvent`, {
      scheduleEventId: eventId,
      scheduleConfigId: this.StoreServ.getScheduleConfig()?.id,
      scheduleId: this.StoreServ.getSchedule()?.id
    })
      .subscribe((res: any) => {
        console.log(res)
        const event = this.StoreServ.getScheduleEventById(res?.scheduleEvent_id)
        this.StoreServ.setCurrentScheduleEvent(event || null)
      })
  }

  stopEvent (eventId: number) {
    this.http.post(`${SERVER_URL}/scheduleConfig/stopEvent`, {
      scheduleEventId: eventId,
      scheduleConfigId: this.StoreServ.getScheduleConfig()?.id,
      scheduleId: this.StoreServ.getSchedule()?.id
    })
      .subscribe((res: any) => {
        console.log(res)
      })
  }
  pauseEvent (eventId: number) {
    this.http.post(`${SERVER_URL}/scheduleConfig/pauseEvent`, {
      scheduleEventId: eventId,
      scheduleConfigId: this.StoreServ.getScheduleConfig()?.id,
      scheduleId: this.StoreServ.getSchedule()?.id
    })
      .subscribe((res: any) => {
        console.log(res)

      })
  }
  resumeEvent (eventId: number) {
    this.http.post(`${SERVER_URL}/scheduleConfig/resumeEvent`, {
      scheduleEventId: eventId,
      scheduleConfigId: this.StoreServ.getScheduleConfig()?.id,
      scheduleId: this.StoreServ.getSchedule()?.id
    })
      .subscribe((res: any) => {
        console.log(res)
      })
  }

  changePlayingEvent (eventId: number) {
    this.http.post(`${SERVER_URL}/scheduleConfig/changePlayingEvent`, {
      scheduleEventId: eventId,
      scheduleConfigId: this.StoreServ.getScheduleConfig()?.id,
      scheduleId: this.StoreServ.getSchedule()?.id
    })
      .subscribe((res: any) => {
        // console.log(res)
        const event = this.StoreServ.getScheduleEventById(res?.scheduleEvent_id)
        if (this.StoreServ.getCurrentScheduleEvent() === null) {
          this.StoreServ.setCurrentScheduleEvent(event || null)
        }
      })
  }

  getActiveScheduleEvent () {
    const eventId = this.StoreServ.getScheduleConfig()?.scheduleEvent_id
    return eventId ? (this.StoreServ.getScheduleEventById(eventId) || null) : null
  }

  nextActionHandler(nextAction: string | string[], response?: any) {
    // console.log('nextActionHandler')
    if (Array.isArray(nextAction)) {
      fetchDataSequentially(nextAction).subscribe({
        next: (res: TEndpointsWithDepsResponse) => {
          if (res.callback) {
            this[res.callback as keyof CounterService](res.response)
          }

        }
      });
    } else {
      switch (nextAction) {
        case 'getScheduleConfig':
          this.getScheduleConfig()
          break;
        case 'suggestNext':
          this.suggestNext(response)
          break;
        default:
          console.log('nextActionHandler - no action')
          break;
      }
    }
  }

  getScheduleConfig() {
    this.http.post(`${SERVER_URL}/getScheduleConfig`, null)
      .subscribe((res: any) => {
        const savedScheduleConfig = this.StoreServ.getScheduleConfig()
        if (savedScheduleConfig === null || savedScheduleConfig?.hash !== res.hash) {
          this.StoreServ.setScheduleConfig(res)
        }
      })
  }


  // public endEventHandler (res: IEndEventSseResponse) {
  //     this.showEndEventScreen()
  // }
  //
  // public showEndEventScreen() {
  //     this.StoreServ.setViewState('EVENT_END')
  // }

  public suggestNext (data: ISuggestNextEventSseResponse) {
    this.StoreServ.setSuggestNext([data.endedEvent, data.nextEvent])
  }
}
