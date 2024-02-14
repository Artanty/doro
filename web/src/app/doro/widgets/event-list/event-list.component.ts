import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnChanges,
  OnInit
} from '@angular/core';

import {
  combineLatest,
} from "rxjs";

import {
  add,
  differenceInMinutes,
  format,
  secondsToMinutes
} from "date-fns";

import {HttpClient} from "@angular/common/http";
import { CounterService } from '../../services/counter.service';
import { StoreService } from '../../services/store.service';
import { SseService } from '../../services/sse.service';
import { IScheduleConfig } from '../../models/scheduleConfig.model';
import { Nullable } from '../../models/_helper-types';
import { ITick } from '../../models/tick.model';
import { IScheduleEvent, IScheduleEventView } from '../../models/scheduleEvent.model';
import {ScheduleEventService} from "../../services/schedule-event.service";

@Component({
  selector: 'app-event-list',
  templateUrl: './event-list.component.html',
  styleUrl: './event-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventListComponent implements OnInit, AfterViewInit, OnChanges{

  scheduleEvents: IScheduleEventView[] = []

  constructor (
    @Inject(StoreService) public StoreServ: StoreService,
    private cdr: ChangeDetectorRef,
    private http: HttpClient,
    @Inject(CounterService) private CounterServ: CounterService,
    @Inject(SseService) private SseServ: SseService,
    @Inject(ScheduleEventService) private ScheduleEventServ: ScheduleEventService
  ) {}

  tracker(_: any, item: any): any{
    return item.id;
  }

  ngOnInit() {
    combineLatest([this.StoreServ.listenScheduleEvents(), this.StoreServ.listenScheduleConfig(), this.SseServ.listenTick()])
      .subscribe(([scheduleEvents, scheduleConfig, tick]: [IScheduleEvent[], Nullable<IScheduleConfig>, ITick]) => {
        if (scheduleEvents?.length) {
          if (scheduleConfig && scheduleConfig.scheduleEvent_id) {
            this.scheduleEvents = scheduleEvents.map((el: IScheduleEventView) => {
              el.timeLength = this.getDiffInMinutes(el.timeFrom, el.timeTo)
              el.isActive = scheduleConfig.scheduleEvent_id === el.id
              if (el.isActive) {
                el.isPlaying = !scheduleConfig.counterIsPaused
                if (el.isPlaying) {
                  const playingEventTickedSeconds = tick.timePassed
                  if (playingEventTickedSeconds) {
                    el.timeLeft = el.timeLength - secondsToMinutes(playingEventTickedSeconds)
                  }
                }
              } else {
                el.isPlaying = false
              }
              return el
            })
          } else {
            this.scheduleEvents = scheduleEvents
          }
        }
        this.setCurrentSheduleEvent(this.scheduleEvents)
        this.cdr.detectChanges()
      })
  }

  //todo mb remove?
  setCurrentSheduleEvent(scheduleEvents: any[]) {
    this.StoreServ.setCurrentScheduleEvent(scheduleEvents?.[0])
  }

  ngAfterViewInit() {
    // this.cdr.detectChanges()
    console.log('child ngAfterViewInit()')
  }

  ngOnChanges(changes: any) {
    console.log(changes)
  }

  public addNewScheduleEvent () {
    const lastScheduleEvent = this.ScheduleEventServ.getLastScheduleEvent()
    const data = {
      name: 'Новое событие',
      timeFrom: new Date(lastScheduleEvent.timeTo).toISOString(),
      timeTo: add(new Date(lastScheduleEvent.timeTo), { minutes: 30 }).toISOString(),
      eventType: 'default',
      schedule_id: lastScheduleEvent.schedule_id
    }
    this.ScheduleEventServ.createScheduleEvent(data).subscribe((res: any) => {
      console.log(res)
    })
  }

  getDiffInMinutes (date1: string, date2: string) {
    return Math.abs(differenceInMinutes(new Date(date1), new Date(date2)))
  }

  /**
   * resume если
   * переданный ид совпадает с сохраненным ид
   * start если
   * переданный ид не совпадает с сохраненным ид
   * и
   * сейчас не проигрывается ивент
   * change если
   * переданный ид не совпадает с сохраненным ид
   * и
   * сейчас проигрывается ивент
   * */
  handlePlay (el: any) {
    if (el.id === this.StoreServ.getScheduleConfig()?.scheduleEvent_id) {
      this.CounterServ.resumeEvent(el.id)
    } else {
      if (this.StoreServ.getScheduleConfig()?.counterIsPaused) {
        this.CounterServ.startEvent(el.id)
      } else {
        this.CounterServ.changePlayingEvent(el.id)
      }
    }
  }

  handlePause (scheduleEvent_id: number) {
    this.CounterServ.pauseEvent(scheduleEvent_id)
  }

  handleSheduleEventClick (el: any) {
    this.StoreServ.setCurrentScheduleEvent(el)
  }

  stopPropagation (event: Event){
    event.stopPropagation()
  }
}
