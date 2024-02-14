import {
  Inject,
  Injectable
} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {StoreService} from "./store.service";
import {IScheduleEvent} from "../models/scheduleEvent.model";
import {differenceInSeconds} from "date-fns";
import {tap} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class ScheduleEventService {

  constructor(
    @Inject(HttpClient) private http: HttpClient,
    @Inject(StoreService) private StoreServ: StoreService
  ) { }

  createScheduleEvent (data: any) {
    return this.http.post('http://localhost:3000/scheduleEvent/create', data)
      .pipe(
        tap((res: any) => {
          this.StoreServ.addScheduleEvents(res)
        })
      )
      // .subscribe((res: any) => {
      //   console.log(res)
      //   // const event = this.Store.getScheduleEventById(res?.scheduleEvent_id)
      //   // this.Store.setCurrentScheduleEvent(event)
      // })
  }

  getLastScheduleEvent (scheduleId?: number) {
    const eventListClone: IScheduleEvent[] = JSON.parse(JSON.stringify(this.StoreServ.getScheduleEvents()))
    eventListClone.sort((a, b) => {
      return differenceInSeconds(new Date(a.timeTo), new Date(b.timeTo))
    })
    return eventListClone[0]
  }

}
