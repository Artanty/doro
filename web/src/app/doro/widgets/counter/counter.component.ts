import {
  AfterContentInit,
  AfterViewChecked,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  OnInit,
  Renderer2,
  ViewChild
} from '@angular/core';

import {HttpClient} from "@angular/common/http";

import {FormArray, FormBuilder, FormControl, FormGroup} from "@angular/forms";
import 'dial-gauge';
import {
  debounceTime,
  distinctUntilChanged,
  Observable,
  tap
} from "rxjs";




import { trigger, transition, style, animate, state } from '@angular/animations';
import { minutesToSeconds } from 'date-fns';
import { secondsToMinutesAndSeconds } from 'src/app/doro/helpers';
import { fetchDataSequentially, TEndpointsWithDepsResponse } from 'src/app/doro/helpers/fetchDataSequentially';
import { ClientService } from 'src/app/doro/services/client.service';
import { CounterService } from 'src/app/doro/services/counter.service';
import { SseService } from 'src/app/doro/services/sse.service';
import { StoreService } from 'src/app/doro/services/store.service';

@Component({
  selector: 'app-counter',
  templateUrl: './counter.component.html',
  styleUrls: ['./counter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CounterComponent implements OnInit {
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

  constructor(
    @Inject(SseService) private SseServ: SseService,
    @Inject(HttpClient) private http: HttpClient,
    @Inject(ClientService) private ClientServ: ClientService,
    @Inject(ChangeDetectorRef) private cdr: ChangeDetectorRef,
    @Inject(FormBuilder) private fb: FormBuilder,
    @Inject(ElementRef) public eRef: ElementRef,
    @Inject(Renderer2) private renderer: Renderer2,
    @Inject(CounterService) private CounterServ: CounterService,
    @Inject(StoreService) private Store: StoreService
  ) {
    this.timersConfigForm = this.fb.group({
      timersConfigFa: this.fb.array([])
    });
  }

  get timersConfigFa(): FormArray {
    return this.timersConfigForm.get('timersConfigFa') as FormArray;
  }

  get counterSuffix() {
    return this.CounterServ.getActiveScheduleEvent()?.name || null
  }

  ngOnInit() {
    this.Store.listenCurrentScheduleEvent().subscribe((res: any)=>{
      this.cdr.detectChanges()
    })
    setTimeout(() => {
      this.isVisible = false
      this.cdr.detectChanges()
    },2000)
    this.SseServ.listenTick().subscribe(
      (res: any) => {
        if (res.action === 'tick') {
          this.counter = res.timePassed
          this.counterType = 'work'
          this.isPlaying = true
          this.interrupting = false
          this.loops = res.loops
          this.sessionId = res.sessionId
          this.cdr.detectChanges()
        }
        if (res.action === 'pause') {
          this.isPlaying = false
          this.cdr.detectChanges()
        }
      }
    );
  }

  message: string = ''

  get customTimerValueView() {
    const timersConfig = this.timersConfigFa.getRawValue()
    if (Array.isArray(timersConfig)) {
      const timerConfig = timersConfig.find(el => el.sessionId === this.sessionId)
      if (timerConfig) {
        const timerLength = this.counterType === 'rest'
          ? timerConfig.sessionRestLength
          : timerConfig.sessionLength
        return secondsToMinutesAndSeconds(minutesToSeconds(timerLength) - this.counter)
      }
    }
    return String(this.counter)
  }

  handlePlay() {
    const el = this.Store.getCurrentScheduleEvent()
    if (el.id === this.Store.getScheduleConfig()?.scheduleEvent_id) {
      this.CounterServ.resumeEvent(el.id)
    } else {
      this.CounterServ.startEvent(el.id)
    }
  }

  pause() {
    if (!this.Store.getScheduleConfig()?.counterIsPaused) {
      const scheduleEvent_id = this.Store.getScheduleConfig()?.scheduleEvent_id
      scheduleEvent_id && this.CounterServ.pauseEvent(scheduleEvent_id)
    } else {
      console.error('no good')
    }
  }

  skip() {
    const nextScheduleEvent = this.getNextScheduleEvent()
    if (nextScheduleEvent) {
      if (this.Store.getScheduleConfig()?.counterIsPaused) {
        this.CounterServ.startEvent(nextScheduleEvent.id)
      } else {
        this.CounterServ.changePlayingEvent(nextScheduleEvent.id)
      }
    }
  }

  getNextScheduleEvent () {
    const events = this.Store.getScheduleEvents()
    const eventId = this.Store.getScheduleConfig()?.scheduleEvent_id
    const eventIndex = events?.map((el: any)=>el.id).indexOf(eventId)
    if ((eventIndex) < (events?.length - 1)) {
      return events[eventIndex + 1]
    }
    return null
  }
}
