import {
  AfterContentInit,
  AfterViewChecked,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  OnInit,
  Renderer2,
  ViewChild
} from '@angular/core';

import {HttpClient} from "@angular/common/http";

import {FormArray, FormBuilder, FormControl, FormGroup} from "@angular/forms";
import 'dial-gauge';
import {
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  map,
  Observable,
  Subscription,
  tap
} from "rxjs";
import { trigger, transition, style, animate, state } from '@angular/animations';
import { differenceInMilliseconds, differenceInSeconds, format, formatDuration, minutesToSeconds } from 'date-fns';
import { secondsToMinutesAndSeconds } from 'src/app/doro/helpers';
import { fetchDataSequentially, TEndpointsWithDepsResponse } from 'src/app/doro/helpers/fetchDataSequentially';
import { ClientService } from 'src/app/doro/services/client.service';
import { CounterService } from 'src/app/doro/services/counter.service';
import { SseService } from 'src/app/doro/services/sse.service';
import { StoreService, TSuggestNext } from 'src/app/doro/services/store.service';
import { ScheduleEventService } from '../../services/schedule-event.service';
import { IScheduleEvent } from '../../models/scheduleEvent.model';
import { getFormattedTime } from 'src/app/helpers/time';
import { getNextItemAfterId } from 'src/app/helpers';
import { Nullable } from '../../models/_helper-types';
import { IScheduleConfig } from '../../models/scheduleConfig.model';

export interface ITick {
  action: string //"tick" | "pause"
  scheduleConfigHash: string
  timePassed?: number
}

@Component({
  selector: 'app-counter',
  templateUrl: './counter.component.html',
  styleUrls: ['./counter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CounterComponent implements OnInit, OnDestroy {
  @ViewChild('dialGauge', {static: true}) dialGauge!: ElementRef;
  @ViewChild('counterRow', {static: true}) counterRow!: ElementRef;
  isPlaying: boolean = false
  loops: number = 1
  mute = false;
  counter = 0
  counterType: string = 'work'
  timersConfigForm: FormGroup;
  clientId: number | null = null
  interrupting: boolean = false
  sessionId: any = null
  isVisible: boolean = true
  currentEventName$: Observable<string | null>
  currentEvent$: Observable<any>
  subs!: Subscription
  nextScheduleEvent: any
  suggestNext: any

  constructor(
    @Inject(SseService) private SseServ: SseService,
    @Inject(HttpClient) private http: HttpClient,
    @Inject(ClientService) private ClientServ: ClientService,
    @Inject(ChangeDetectorRef) private cdr: ChangeDetectorRef,
    @Inject(FormBuilder) private fb: FormBuilder,
    @Inject(ElementRef) public eRef: ElementRef,
    @Inject(Renderer2) private renderer: Renderer2,
    @Inject(CounterService) private CounterServ: CounterService,
    @Inject(StoreService) private StoreServ: StoreService,
    @Inject(ScheduleEventService) private ScheduleEventServ: ScheduleEventService
  ) {
    this.timersConfigForm = this.fb.group({
      timersConfigFa: this.fb.array([])
    });
    this.currentEventName$ = this.StoreServ.listenCurrentScheduleEvent()
    .pipe(
      // tap((el => console.log(el))),
      map(el => el?.name || 'Начать работу (25 мин)')
      )
      this.currentEvent$ = this.StoreServ.listenCurrentScheduleEvent()
  }

  get timersConfigFa(): FormArray {
    return this.timersConfigForm.get('timersConfigFa') as FormArray;
  }

  get counterSuffix() {
    return this.CounterServ.getActiveScheduleEvent()?.name || null
  }

  ngOnInit() {
    setTimeout(() => {
      this.isVisible = false
      this.cdr.detectChanges()
    }, 2000)

    combineLatest([
      this.StoreServ.listenScheduleEvents(),
      this.StoreServ.listenScheduleConfig(),
      this.SseServ.listenTick(),
      this.StoreServ.listenSuggestNext()
    ])
    .subscribe(([scheduleEvents, scheduleConfig, tick, suggestNext]: [IScheduleEvent[], Nullable<IScheduleConfig>, ITick, Nullable<TSuggestNext>]) => {
      if (scheduleEvents?.length) {
        if (scheduleConfig && scheduleConfig.scheduleEvent_id) {
          const activeEvent = scheduleEvents.find(se => scheduleConfig.scheduleEvent_id === se.id) ?? scheduleEvents[0]
          console.log(scheduleConfig.scheduleEvent_id)
          if (activeEvent) {
            this.nextScheduleEvent = getNextItemAfterId(scheduleEvents, activeEvent.id)
          }
          if (suggestNext) {
            this.suggestNext = suggestNext
          }
          if (tick.action === 'tick') {
            this.counter = tick.timePassed || 0
            this.isPlaying = true
            // this.cdr.detectChanges()
          }
          if (tick.action === 'pause') {
            this.isPlaying = false
            // this.cdr.detectChanges()
          }
        }
      }
      this.cdr.detectChanges()
    })
  }

  ngOnDestroy () {
    // this.subs.unsubscribe()
  }

  message: string = ''
  /**
   * get event length - tick
   */
  get customTimerValueView() {
    // save for counter without backend:
    // const timersConfig = this.timersConfigFa.getRawValue()
    // if (Array.isArray(timersConfig)) {
    //   const timerConfig = timersConfig.find(el => el.sessionId === this.sessionId)
    //   if (timerConfig) {
    //     const timerLength = this.counterType === 'rest'
    //       ? timerConfig.sessionRestLength
    //       : timerConfig.sessionLength
    //     return secondsToMinutesAndSeconds(minutesToSeconds(timerLength) - this.counter)
    //   }
    // }
    const event = this.StoreServ.getCurrentScheduleEvent()
    try {
      const eventLength = differenceInMilliseconds(new Date(event?.timeTo || ''), new Date(event?.timeFrom || ''))
      const eventLengthLeft = eventLength - this.counter * 1000
      return getFormattedTime(eventLengthLeft, 'hh:mm:ss')
    } catch (e) {
      console.error('fix this:')
      console.error(e)
      return ''
    }
  }

  handlePlay() {
    const el = this.StoreServ.getCurrentScheduleEvent() as IScheduleEvent
    if (el.id === this.StoreServ.getScheduleConfig()?.scheduleEvent_id) {
      this.CounterServ.resumeEvent(el.id)
    } else {
      this.CounterServ.startEvent(el.id)
    }
  }

  pause() {
    if (!this.StoreServ.getScheduleConfig()?.counterIsPaused) {
      const scheduleEvent_id = this.StoreServ.getScheduleConfig()?.scheduleEvent_id
      scheduleEvent_id && this.CounterServ.pauseEvent(scheduleEvent_id)
    } else {
      console.error('no good')
    }
  }

  skip() {
    if (this.nextScheduleEvent) {
      if (this.StoreServ.getScheduleConfig()?.counterIsPaused) {
        this.CounterServ.startEvent(this.nextScheduleEvent.id)
      } else {
        this.CounterServ.changePlayingEvent(this.nextScheduleEvent.id)
      }
    }
  }


  public handleCreateEventsAndPlay () {
    const data = {
      scheduleId: this.StoreServ.getScheduleConfig()?.schedule_id,
      scheduleConfigId: this.StoreServ.getScheduleConfig()?.id
    }
    const sub = this.ScheduleEventServ.createEventsAndPlay(data).subscribe((res => {
      // console.log(res)
    }))
    this.subs.add(sub)
  }
}
