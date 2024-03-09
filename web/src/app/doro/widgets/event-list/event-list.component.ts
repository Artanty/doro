import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnChanges,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren
} from '@angular/core';

import {
  Subscription,
  combineLatest,
  concatMap,
  delay,
  from,
  map,
  switchMap,
  tap,
  timer,
} from "rxjs";

import {
  add,
  differenceInMinutes,
  format,
  secondsToMinutes
} from "date-fns";

import {HttpClient} from "@angular/common/http";
import { CounterService } from '../../services/counter.service';
import {
  StoreService,
  TSuggestNext
} from '../../services/store.service';
import { SseService } from '../../services/sse.service';
import { IScheduleConfig } from '../../models/scheduleConfig.model';
import { Nullable } from '../../models/_helper-types';
import { ITick } from '../../models/tick.model';
import { IScheduleEvent, IScheduleEventView } from '../../models/scheduleEvent.model';

import {deleteProps} from "../../helpers";
import {ScheduleEventService} from "../../services/schedule-event.service";
import {ISuggestNextEventSseResponse} from "../../../../../../contracts/endEventSseResponse";

@Component({
  selector: 'app-event-list',
  templateUrl: './event-list.component.html',
  styleUrl: './event-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventListComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy{
  @ViewChildren('myElement') elements: QueryList<any> | undefined;
  scheduleEvents: IScheduleEventView[] = []
  isControlsExpanded: boolean = false
  eventTemplates: any[] = []
  subs!: Subscription

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
    combineLatest([
      this.StoreServ.listenScheduleEvents(),
      this.StoreServ.listenScheduleConfig(),
      this.SseServ.listenTick(),
      this.StoreServ.listenSuggestNext()
    ])
    .subscribe(([scheduleEvents, scheduleConfig, tick, suggestNext]: [IScheduleEvent[], Nullable<IScheduleConfig>, ITick, Nullable<TSuggestNext>]) => {
      if (scheduleEvents?.length) {
        if (scheduleConfig && scheduleConfig.scheduleEvent_id) {
          this.scheduleEvents = scheduleEvents.map((el: IScheduleEventView) => {
            el.timeLength = this.getDiffInMinutes(el.timeFrom, el.timeTo)
            el.isActive = scheduleConfig.scheduleEvent_id === el.id && !suggestNext
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
            // set ended event & suggested next event
            if (suggestNext && Array.isArray(suggestNext)) {

              if (suggestNext[0] === el.id) {
                el.isEnded = true
              }
              if (suggestNext[1] === el.id) {
                el.isSuggestedNext = true
              }
            } else {
              el.isSuggestedNext = false
            }
            return el
          })
        } else {
          this.scheduleEvents = scheduleEvents
        }
      }
      this.cdr.detectChanges()
      this.sequentialFadeIn()
    })

  }

  ngAfterViewInit() {
    // this.cdr.detectChanges()
    // console.log('child ngAfterViewInit()')

  }

  ngOnChanges(changes: any) {
    // console.log(changes)
  }

  ngOnDestroy () {
  }

  public addNewScheduleEvent (template: any) {
    const lastScheduleEvent = this.ScheduleEventServ.getLastScheduleEvent()
    const data = {
      name: template.eventName,
      timeFrom: new Date(lastScheduleEvent?.timeTo ?? new Date).toISOString(),
      timeTo: add(new Date(lastScheduleEvent?.timeTo ?? new Date), { minutes: template.eventLength }).toISOString(),
      eventType: template.eventType,
      schedule_id: lastScheduleEvent?.schedule_id ?? this.StoreServ.getSchedule()?.id
    }
    this.ScheduleEventServ.createScheduleEvent(data).subscribe((res: any) => {
      const lastElementIndex = this.StoreServ.getScheduleEvents()?.length - 1
      this.scrollToElement(lastElementIndex)
    })
  }

  public deleteScheduleEvent (data: IScheduleEventView, index: number) {
    const reqData = {
      scheduleEvent: deleteProps(data, ['isActive', 'timeLength', 'isPlaying', 'timeLeft']) as IScheduleEvent,
      scheduleConfigId: (this.StoreServ.getScheduleConfig()?.id) as number
    }

    this.ScheduleEventServ.deleteScheduleEvent(reqData)
    .pipe(
      tap(() => {
        const element = this.elements?.toArray()[index]?.nativeElement;
        if (element) {
          element.classList.add('fade-out');
        }
      }),
      delay(1000),
      concatMap(async () => this.StoreServ.removeScheduleEvents(reqData.scheduleEvent))
    )
    .subscribe()
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
    this.StoreServ.setSuggestNext(null) // hide suggested and allow playing event highlight
  }

  handlePause (scheduleEvent_id: number) {
    this.CounterServ.pauseEvent(scheduleEvent_id)

  }

  handleSheduleEventClick (el: any) {
    // this.StoreServ.setCurrentScheduleEvent(el)
    // todo delete or make activeEvent
  }

  stopPropagation (event: Event){
    event.stopPropagation()
  }

  toggleControlsRow () {
    this.isControlsExpanded = !this.isControlsExpanded
    this.cdr.detectChanges()
  }

  private scrollToElement(index: number): void {
    const element = this.elements?.toArray()[index].nativeElement;
    element.scrollIntoView({ behavior: 'smooth' });
  }

  private sequentialFadeIn () {
    if (this.elements?.toArray()?.length) {
      const elements$ = from(this.elements?.toArray())
      // Map each element to an observable that emits after a delay
      const fadeIn$ = elements$.pipe(
        concatMap((el: any) =>
          // Emit a value after a delay
          timer(50).pipe(
            // Map to the element
            // the context of the RxJS concatMap operator, the map(() => el) part is used to transform each emitted value from the inner observable (in this case, the timer) into a new value.
            // When timer(index * 1000) emits a value (after the specified delay), it emits a numerical value (usually 0 since we're not specifying any value).
            // We then use the map(() => el) operator to transform this emitted value into the original element el itself. This means that instead of emitting the numerical value from the timer, we emit the el, which is the element we want to add the fade-in class to.
            // So essentially, map(() => el) is a way of converting the emitted value from the inner observable (the timer) into the element itself, allowing us to work directly with the element in the subsequent steps of the observable chain.
            map(() => el)
          )
        )
      );
      // Subscribe to apply the fade-in effect
      fadeIn$.subscribe((el: any) => {
        el.nativeElement.classList.add('fade-in');
      });
    }
  }

  updateEventTemplates (data: any) {
    // console.log(data)
    // debounceTime(300)
    this.eventTemplates = data
    this.cdr.detectChanges()
  }
  public addEventTemplate () {

  }
}
