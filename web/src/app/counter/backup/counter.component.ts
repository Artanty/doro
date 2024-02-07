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
import {SseService} from "../services/sse.service";
import {HttpClient} from "@angular/common/http";
import {ClientService} from "../services/client.service";
import {FormArray, FormBuilder, FormControl, FormGroup} from "@angular/forms";
import 'dial-gauge';
import {
  debounceTime,
  distinctUntilChanged,
  Observable,
  tap
} from "rxjs";
import {minutesToSeconds, secondsToMinutesAndSeconds} from './../helpers';

import {
  fetchDataSequentially,
  TEndpointsWithDepsResponse
} from "../helpers/fetchDataSequentially";
import {CounterService} from "../services/counter.service";
import {StoreService} from "../services/store.service";
class dialGauge {
}
export interface TimerConfig {
  sessionId: string
  sessionLength: number
  sessionRestLength: number
}

interface ngAfterViewInit {
}

@Component({
  selector: 'app-counter',
  templateUrl: './counter.component.html',
  styleUrls: ['./counter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CounterComponent implements OnInit, AfterContentInit, AfterViewChecked, AfterViewInit {
  @ViewChild('dialGauge', {static: true}) dialGauge!: ElementRef;
  @ViewChild('counterRow', {static: true}) counterRow!: ElementRef;
  isPalying: boolean = false
  connectDisabled = false
  loops: number = 1
  // initialize static data
  targetTime = undefined;
  targetDelta: any = undefined;
  intervalId = undefined;
  reset = true;
  onSession = true;
  mute = false;
  breakLength = null;
  counter = 0
  counterType: string = 'work'
  isCounterTick: boolean = false
  timersConfigForm: FormGroup;
  // timersConfigFa = new FormArray([]) as any
  // timerConfigFg = new FormGroup({
  //   sessionId: new FormControl('work'),
  //   sessionLength: new FormControl(25),
  //   sessionRestLength: new FormControl(5),
  // });
  // timersConfigFa: FormArray;
  // timerConfigFg: FormGroup;
  clientId: number | null = null
  interrupting: boolean = false
  sessionId: any = null

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
    this.Store.listenCurrentScheduleEvent().subscribe(res=>console.log(res))
    this.timersConfigForm = this.fb.group({
      timersConfigFa: this.fb.array([])
    });

    this.timersConfigFa.valueChanges
      .pipe(
        debounceTime(2000),
        distinctUntilChanged((prev: any, next: any) => JSON.stringify(prev) === JSON.stringify(next))
      )
      .subscribe((res: any) => {
        this.setTimersConfig(res)
      })
  }

  get timersConfigFa(): FormArray {
    return this.timersConfigForm.get('timersConfigFa') as FormArray;
  }

  get isInterruptToRest(): boolean {
    return this.interrupting && this.counterType === 'work'
  }

  get isInterruptToWork(): boolean {
    return this.interrupting && this.counterType === 'rest'
  }

  get isWorking() {
    return !this.interrupting && this.counterType === 'work'
  }

  get isResting() {
    return !this.interrupting && this.counterType === 'rest'
  }

  get counterSuffix() {
    if (this.isWorking) {
      return 'Работа'
    }
    if (this.isResting) {
      return 'Отдых'
    }
    return ''
  }

  //mine
  ngOnInit() {
    this.connect()
  }

  ngAfterContentInit() {
    // setTimeout(() => {
    //   this.showMessage('Время отдыха!')
    // },1000)
    // this.cdr.detectChanges()
  }
  ngAfterViewChecked(){
    // this.cdr.detectChanges()
  }

  message: string = ''

  showMessage(text: string) {
    this.message = text
    const counterWidth = this.counterRow.nativeElement.firstChild.offsetWidth
    if (text) {
      this.renderer.setStyle(this.counterRow.nativeElement, 'margin-left', `-${counterWidth}px`)
    } else {
      this.renderer.setStyle(this.counterRow.nativeElement, 'margin-left', `0px`);
    }
    this.cdr.detectChanges()
  }

  getTimersConfig() {
    // this.http.post('http://localhost:3000/getTimersConfig', '')
    //   .subscribe((res: any) => {
    //     if (res.status === 'ok') {
    //       console.log(res)
    //     }
    //   })
  }

  setTimersConfig(data: any) {
    this.http.post('http://localhost:3000/setTimersConfig', data)
      .subscribe((res: any) => {
        if (res.status === 'ok') {
          console.log(res)
        }
      })
  }

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

  connect() {
    this.SseServ.createEventSource().subscribe(
      (res: any) => {
        if (res.action === 'tick') {
          this.counter = res.timePassed
          this.counterType = 'work'
          this.isPalying = true
          this.interrupting = false
          this.loops = res.loops
          this.sessionId = res.sessionId
          this.cdr.detectChanges()
        }
        if (res.action === 'pause') {
          this.isPalying = false
          this.cdr.detectChanges()
        }
        if (res.action === 'restTick') {
          this.counter = res.timePassed
          this.counterType = 'rest'
          this.isPalying = true
          this.interrupting = false
          this.loops = res.loops
          this.sessionId = res.sessionId
          this.cdr.detectChanges()
        }
        if (res.action === 'timersConfig') {
          const timersConfig = res.data
          // console.log(timersConfig)
          if (Array.isArray(timersConfig)) {
            if (JSON.stringify(timersConfig) !== JSON.stringify(this.timersConfigFa.getRawValue())) {
              timersConfig.forEach(timerConfig => {
                const timerConfigFg = this.fb.group({
                  sessionId: [timerConfig.sessionId],
                  sessionLength: [timerConfig.sessionLength],
                  sessionRestLength: [timerConfig.sessionRestLength],
                  sessionName: [timerConfig.sessionName]
                });
                (this.timersConfigForm.get('timersConfigFa') as FormArray).clear();
                (this.timersConfigForm.get('timersConfigFa') as FormArray).push(timerConfigFg);
                this.cdr.detectChanges()
              })
            }
          }
        }
        if (res.action === 'interruptToRest') {
          this.interrupting = true
          this.isPalying = false
          this.cdr.detectChanges()
          this.showMessage('Время отдыха!')
        }
        if (res.action === 'interruptToSession') {
          this.interrupting = true
          this.isPalying = false
          this.cdr.detectChanges()
          this.showMessage('За работу!')
        }
        if (res.clientId) {
          this.clientId = res.clientId
          this.getTimersConfig()
        }
        if (res.nextAction) {
          this.nextActionHandler(res.nextAction)
        }
        // this.ClientServ.setClientId(res)
        //   .then(() => {
        //     this.checkClientId()
        //   })
        //   .catch((e) => {
        //     console.log(e)
        //   })
        if (res.scheduleConfigHash !== this.Store.getScheduleConfig()?.hash) {
          this.getScheduleConfig()
        }
      }
    );
  }

  nextActionHandler(nextAction: string | string[]) {
    if (Array.isArray(nextAction)) {
      fetchDataSequentially(nextAction).subscribe({
        next: (res: TEndpointsWithDepsResponse) => {
          if (res.callback) {
            this.CounterServ[res.callback as keyof CounterService](res.response)
          }

        }
      });
    } else {
      switch (nextAction) {
        case 'getScheduleConfig':
          this.getScheduleConfig()
          break;
        default:
          console.log('nextActionHandler - no action')
          break;
      }
    }
  }

  checkClientId() {
    const clientId = this.ClientServ.getClientId()
    if (clientId) {
      this.ClientServ.checkClientId(clientId)
        .subscribe(res => {
          if ((res as any).verified === true) {
            this.connectDisabled = true
            this.cdr.detectChanges()
          } else {
            this.onDisconnect()
          }
        })
    } else {
      this.onDisconnect()
    }
  }

  onDisconnect() {
    this.closeConnectionAndEnableConnectButton()
    this.connect()
  }

  closeConnectionAndEnableConnectButton() {
    this.connectDisabled = false
    localStorage.removeItem('clientId')
    this.SseServ.closeSseConnection()
  }

  // { action: 'start' | 'pause' | 'stop', event:string, timePassed: number, timeAll: number }

  getSeconds(minutes: number) {
    return minutes * 60
  }

  getMinutes(seconds: number) {
    return seconds / 60
  }


  resetTimer() {
    const data = {action: 'reset', event: ''}
    this.http.post('http://localhost:3000/action', data)
      .subscribe((res: any) => {
        if (res.status === 'ok') {
          console.log(res)
        }
        this.cdr.detectChanges()
      })
  }


  switchToBreak() {
    // const { rest } = this.controlsFg.getRawValue()
    // const data = {
    //   action: 'start',
    //   event: 'rest',
    //   timePassed: 1,
    //   timeAll: rest
    // }
    // this.http.post('http://localhost:3000/action', data)
    //   .subscribe((res: any) => {
    //
    //     if (res.status === 'ok') {
    //       this.counterType = 'rest'
    //     }
    //     this.cdr.detectChanges()
    //   })

  }

  switchToWork() {
    this.counterType = 'work'
  }

  saveSettings(data: any) {
    this.http.post('http://localhost:3000/settings', data)
      .subscribe((res: any) => {
        if (res.status === 'ok') {
          //
        }
      })
  }

  takeARest() {
    const {sessionId} = this.timersConfigFa.getRawValue()[0]
    const data = {action: 'restTick', sessionId}
    this.http.post('http://localhost:3000/action', data)
      .subscribe((res: any) => {

        if (res.status === 'ok') {
          this.isCounterTick = false
          this.showMessage('')
        }
        this.cdr.detectChanges()
      })
  }

  startTimer() {
    const {sessionId} = this.timersConfigFa.getRawValue()[0]
    const data = {
      action: 'tick',
      sessionId: sessionId
    }
    this.http.post('http://localhost:3000/action', data)
      .subscribe((res: any) => {
        console.log(res)
        this.showMessage('')
      })
  }

  play() {
    if (this.interrupting === true && this.counterType === 'work') {
      this.takeARest()
    } else {
      this.startTimer()
    }
  }

  handlePlay() {
    const el = this.Store.getCurrentScheduleEvent()
    if (el.id === this.Store.getScheduleConfig()?.scheduleEvent_id) {
      this.CounterServ.resumeEvent(el.id)
    } else {
      this.CounterServ.startEvent(el.id)
    }
  }

  // pause() {
  //   const data = {action: 'pause'}
  //   this.http.post('http://localhost:3000/action', data)
  //     .subscribe((res: any) => {
  //       console.log(res)
  //     })
  // }
  pause() {
    if (!this.Store.getScheduleConfig()?.counterIsPaused) {
      const scheduleEvent_id = this.Store.getScheduleConfig()?.scheduleEvent_id
      this.CounterServ.pauseEvent(scheduleEvent_id)
    } else {
      console.error('no good')
    }
  }

  skip() {
    if (this.counterType === 'work') {
      this.forceInterruptToRest()
    } else {
      this.forceInterruptToWork()
    }
  }

  forceInterruptToRest() {
    const data = {action: 'forceInterruptToRest'}
    this.http.post('http://localhost:3000/action', data)
      .subscribe((res: any) => {
        console.log(res)
      })
  }

  forceInterruptToWork() {
    const data = {action: 'forceInterruptToWork'}
    this.http.post('http://localhost:3000/action', data)
      .subscribe((res: any) => {
        console.log(res)
      })
  }

  test(testCase: number) {
    this.http.get('http://localhost:3000/test?case=' + testCase)
      .subscribe((res: any) => {
        console.log(res)
      })
  }

  getScheduleConfig() {
    this.http.post('http://localhost:3000/getScheduleConfig', null)
      .subscribe((res: any) => {
        const savedScheduleConfig = this.Store.getScheduleConfig()
        if (savedScheduleConfig === null || savedScheduleConfig?.hash !== res.hash) {
          this.Store.setScheduleConfig(res)
        }
      })
  }

  rem () {
    this.Store.setScheduleEvents([1,3,4])
  }
  ngAfterViewInit() {
    console.log('parent ngAfterViewInit()')
  }
}
