import { Inject, Injectable } from '@angular/core';
import {
  Observable,
  filter,
  delay,
  from,
  of
} from "rxjs";
import { StoreService } from './store.service';
import { ITick } from '../models/tick.model';
import {CounterService} from "./counter.service";
import {
  RECONNECT_TRIES,
  SERVER_URL
} from "../../../../env";


@Injectable({
  providedIn: 'root'
})
export class SseService {
  private _eventSource!: EventSource
  constructor(
    @Inject(StoreService) private StoreServ: StoreService,
    @Inject(CounterService) private CounterServ: CounterService
  ) {}

  public createEventSource(): void {
    let tries = RECONNECT_TRIES - 1
    this._eventSource = new EventSource(`${SERVER_URL}/events`);
    this._eventSource.onerror = event => {
      if (tries) {
        tries--
      } else {
        this.closeSseConnection()
      }
    }
    this.StoreServ.setConnectionState('LOADING')
    new Observable(observer => {
      this._eventSource.onmessage = event => {
        const messageData: any = JSON.parse(event.data);
        observer.next(messageData);
      }
    }).subscribe({
      next: (res: any) => {
        this.StoreServ.setConnectionState('READY')
        if (res.nextAction) {
          this.CounterServ.nextActionHandler(res.nextAction)
        }

        if (res.scheduleConfigHash !== this.StoreServ.getScheduleConfig()?.hash) {
          this.CounterServ.getScheduleConfig()
        }
        this.StoreServ.setTick(res)
      }
    })
  }

  public listenTick (): Observable<ITick> {
    return this.StoreServ.listenTick().pipe(filter(Boolean))
  }

  public closeSseConnection () {
    this.StoreServ.setConnectionState('DISCONNECTED')
    this._eventSource.close()
  }

}
