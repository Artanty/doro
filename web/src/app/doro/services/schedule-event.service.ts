import {
  Inject,
  Injectable
} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {StoreService} from "./store.service";
import {IScheduleEvent} from "../models/scheduleEvent.model";
import {differenceInSeconds} from "date-fns";
import {
  combineLatest,
  map,
  shareReplay,
  tap
} from "rxjs";
import {SERVER_URL} from "../../../../env";
import { SseService } from './sse.service';

@Injectable({
  providedIn: 'root'
})
export class ScheduleEventService {

  obs$: any
  constructor(
    @Inject(HttpClient) private http: HttpClient,
    @Inject(StoreService) private StoreServ: StoreService,
    @Inject(SseService) private SseServ: SseService
  ) {
    this.obs$ = combineLatest([
      this.StoreServ.listenScheduleEvents(),
      this.StoreServ.listenScheduleConfig(),
      this.SseServ.listenTick(),
      this.StoreServ.listenSuggestNext()
    ]).pipe(shareReplay(1))
   }



  createScheduleEvent (data: Partial<IScheduleEvent>) {
    return this.http.post<IScheduleEvent>(`${SERVER_URL}/scheduleEvent/create`, data)
      .pipe(
        tap((res: IScheduleEvent) => {
          this.StoreServ.addScheduleEvents(res)
        })
      )
  }

  deleteScheduleEvent (data: { scheduleEvent: IScheduleEvent, scheduleConfigId: number }) {
    return this.http.post<any>(`${SERVER_URL}/scheduleEvent/delete`, data)
  }

  getLastScheduleEvent (scheduleId?: number): IScheduleEvent | undefined {
    const eventListClone: IScheduleEvent[] = JSON.parse(JSON.stringify(this.StoreServ.getScheduleEvents()))
    eventListClone.sort((a, b) => {
      return differenceInSeconds(new Date(a.timeTo), new Date(b.timeTo))
    })

    return eventListClone[eventListClone.length - 1]
  }

  createEventsAndPlay (data: { scheduleId?: number, scheduleConfigId?: number }) {
    if (!data.scheduleId || !data.scheduleConfigId) { console.error('FIX IT!') }
    return this.http.post<IScheduleEvent[]>(`${SERVER_URL}/scheduleEvent/createAndPlay`, data)
      .pipe(
        // tap((res: IScheduleEvent) => {
        //   // this.StoreServ.addScheduleEvents(res)
        //   console.log(res)
        // })
      )
  }
  // createDefaultScheduleEvents

  // getNextScheduleEvent () {
  //   combineLatest([
  //     this.StoreServ.listenScheduleEvents(),
  //     this.StoreServ.listenScheduleConfig(),
  //     this.SseServ.listenTick(),
  //     this.StoreServ.listenSuggestNext()
  //   ])

  // }

  /** todo:
   * schedule id === null -> create schedule
   * schedule id !== null -> add events to schedule
   */
  createScheduleWithEvents (data: {schedule: any, events: Partial<IScheduleEvent>[] }) {
    return this.http.post<any>(`${SERVER_URL}/scheduleEvent/batchCreate`, data)
      .pipe(
        tap((res: any) => {
          // this.StoreServ.addScheduleEvents(res)
          console.log(res)
        })
      )
  }
}
