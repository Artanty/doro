import {
  Inject,
  Injectable
} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {StoreService} from "./store.service";
import {IScheduleEvent} from "../models/scheduleEvent.model";
import {differenceInSeconds} from "date-fns";
import {
  map,
  tap
} from "rxjs";
import {SERVER_URL} from "../../../../env";

@Injectable({
  providedIn: 'root'
})
export class ScheduleEventService {

  constructor(
    @Inject(HttpClient) private http: HttpClient,
    @Inject(StoreService) private StoreServ: StoreService
  ) { }

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
}
