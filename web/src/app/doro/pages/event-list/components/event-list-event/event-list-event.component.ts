import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, Input, ChangeDetectorRef, Injector } from "@angular/core";
import { Router } from "@angular/router";
import { Subject, Observable, map, takeUntil, startWith, tap, catchError, EMPTY } from "rxjs";
import { countPrc } from "@helpers/count-percent.util";
import { dd } from "@helpers/dd";
import { EventService } from "@services/basic-event/basic-event.service";
import { EventProps, Schedule, EventViewState, EventStateResItem, EventStateResItemStateless, EventState } from "@services/basic-event/basic-event.types";
import { ScheduleService } from "@services/schedule/schedule.service";
import { EventStates, EventTypePrefix } from "../../../../constants";
import { AppStateService } from "@services/core/app-state.service";
// {
//     "id": 921,
//     "name": "event 1",
//     "length": 360,
//     "is_rest": 1,
//     "schedule_id": 2,
//     "schedule_name": "schedule  id 2",
//     "schedule_is_playing": 1,
//     "schedule_position": 1091,
//     "playhead": 2,
//     "schedule_owner": "74aa6454c1fcabffea7ff172:324c9c440c841889632429b574a39942",
//     "is_active_event": 1
// }
@Component({
  selector: 'app-event-list-event',
  standalone: false,
  templateUrl: './event-list-event.component.html',
  styleUrl: './event-list-event.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventListEventComponent implements OnInit, OnDestroy {
  @Input() eventProps!: EventProps;
  isDeleting$ = new Subject();
  menuItems = [
    { id: 'DELETE', name: 'Удалить' },
  ];
  scheduleMenuItems$: Observable<Schedule[]>;
  
  eventState$!: Observable<EventViewState<EventStateResItem>>;
  public EventStates = EventStates;
  public eventStateNames: Record<number, string> = {
    [-1]: 'PENDING',
    [-2]: 'ERROR',
    [0]: 'STOPPED',
    [1]: 'PLAYING',
    [2]: 'PAUSED',
    [3]: 'COMPLETED'
  };
  private destroy$ = new Subject<void>();
  public eventState: any = null
  
  constructor(
    private cdr: ChangeDetectorRef,
    private eventService: EventService,
    private injector: Injector,
    private router: Router,
    private _scheduleService: ScheduleService,
    private _state: AppStateService,
  ) {
    this.scheduleMenuItems$ = this._state.schedules.listen()
    .pipe(
      map(res => {
        let result = res
        if (this.eventProps.schedule_id) {
          result = res.filter(el => el.id !== this.eventProps.schedule_id);
        }
        return result;
      }));
  }

  /**
   * Подписываемся на свойства события из (doro@web),
   * и одновременно ожидаем состояние события из (tik@web)
   * EventWithState = { eventProps, eventState }
   * */
  ngOnInit() {
    // dd(this.eventProps)
    const initalState: EventViewState<EventStateResItemStateless> = {
      viewState: 'LOADING_VIEW_STATE',
      eventState: -1 // pending
    }
    /**
     * те, что не is_playing - полностью отображаем из props.
     * listen state - только для идущих событий.
     */
    this.eventState$ = 
      this.eventService.listenEventState(EventTypePrefix.BASIC, this.eventProps)
        .pipe(
          takeUntil(this.destroy$),
          map((res: EventStateResItem) => {
            const { stt, ...rest } = res;
            const readyState: EventViewState<EventStateResItemStateless> = {
              viewState: 'READY_VIEW_STATE',
              eventState: stt,
              data: { ...rest, prc: countPrc(Number(res.len), res.cur) }
            };

            return readyState;
          }),
          startWith(initalState),
          tap((res: any) => {
            this.cdr.detectChanges()
          }),
          catchError(error => {
            console.error('Failed while listenEventState in list item:', error);
          
            const errorState: EventViewState<EventState> = {
              viewState: 'READY_VIEW_STATE',
              eventState: EventStates.ERROR,
              error: error.message
            };

            return EMPTY;
          })
        )
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  playEvent(): void {
    this.eventService.playEvent(this.eventProps.id, this.eventProps.schedule_id).subscribe()
  }

  goToEventTimer() {
    this.router.navigateByUrl(`/doro/timer/${this.eventProps.id}`);
  }

  deleteEvent() {
    this.eventService.deleteEvent(this.eventProps.id);
  }

  addToSchedule(data: any) {
    const scheduleId = data.id;
    this.eventService.addToSchedule(this.eventProps.id, scheduleId).subscribe()
  }

  pauseEvent() {
    this.eventService.pauseEvent(this.eventProps.id, this.eventProps.schedule_id).subscribe()
  }

 
}