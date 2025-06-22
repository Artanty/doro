import { Inject, Injectable } from '@angular/core';
import {
  Observable,
  filter,
  delay,
  from,
  of,
  take,
  startWith
} from "rxjs";
import { StoreService } from './store.service';
import { ITick } from '../models/tick.model';
import {CounterService} from "./counter.service";

import { ScheduleEventService } from './schedule-event.service';
import { ScheduleService } from './schedule.service';
import { UserService } from './user.service';


@Injectable({
  providedIn: 'root'
})
export class SseService {
  private _eventSource!: EventSource
  constructor(
    @Inject(StoreService) private StoreServ: StoreService,
    @Inject(CounterService) private CounterServ: CounterService,
    @Inject(ScheduleEventService) private ScheduleEventServ: ScheduleEventService,
    @Inject(ScheduleService) private ScheduleServ: ScheduleService,
    @Inject(UserService) private UserServ: UserService
  ) {}

  public createEventSource(): void {
    let tries = Number(process.env['RECONNECT_TRIES'] || 1) - 1
    this._eventSource = new EventSource(`${process.env['SERVER_URL']}/events?token=${encodeURIComponent(this.UserServ.getUserToken())}`);
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

          if (this.readHashOf(res, 'config') !== this.config?.hash) {
            this.CounterServ.getScheduleConfig()
          }
          if (this.readHashOf(res, 'schedule') !== this.config?.scheduleHash) {
            this.waitConfig().subscribe(() => {
              this.config?.schedule_id && this.ScheduleServ.getSchedule(this.config?.schedule_id)
            })
          }
          if (this.readHashOf(res, 'events') !== this.config?.scheduleEventsHash) {
            this.waitConfig().subscribe(() => {
              this.config?.schedule_id && this.ScheduleEventServ.getScheduleEvents(this.config?.schedule_id)
            })
          }
          if (res.action === 'tick') {
            this.StoreServ.setTick(res)
          }
        }
    })
  }

  /**
   * wait for first load of config
   */
  waitConfig() {
    return this.StoreServ.listenScheduleConfig().pipe(
      startWith(this.config),
      filter(Boolean),
      take(1)
    )
  }

  get config () {
    return this.StoreServ.getScheduleConfig()
  }

  private readHashOf (res: any, entity: string): string {
    // hash: scheduleConfig.hash + '__' + scheduleConfig.scheduleHash + '__' + scheduleConfig.scheduleEventsHash
    const hashes = res.hash.split('__')
    let index
    switch (entity) {
      case 'config':
        index = 0
        break;
      case 'schedule':
        index = 1
        break;
      case 'events':
        index = 2
        break;
      default:
        throw new Error('function readHashOf failed. wrong entity name')
    }
    return hashes[index]
  }

  public listenTick (): Observable<ITick> {
    return this.StoreServ.listenTick().pipe(filter(Boolean))
  }

  public closeSseConnection () {
    this.StoreServ.setConnectionState('DISCONNECTED')
    this._eventSource.close()
  }

}
