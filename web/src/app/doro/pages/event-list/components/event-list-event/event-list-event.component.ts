import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Injector, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subject, takeUntil, filter, startWith, distinctUntilChanged, map, tap, withLatestFrom, catchError, EMPTY, finalize } from 'rxjs';
import { EventStates, EventTypePrefix } from 'src/app/doro/constants';
import { countPrc } from 'src/app/doro/helpers/count-percent.util';
import { EventService } from 'src/app/doro/services/event.service';
import { EventProps, EventViewState, EventStateResItem, EventStateResItemStateless, EventState } from 'src/app/doro/services/event/event.types';
import { Schedule, ScheduleService } from 'src/app/doro/services/schedule.service';

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
    private _scheduleService: ScheduleService
  ) {
    this.scheduleMenuItems$ = this._scheduleService.getSchedules().pipe(
      map(res => {
        if (this.eventProps.schedule_id) {
          return res.filter(el => el.id !== this.eventProps.schedule_id);
        }
        return res;
      }));
  }

  /**
   * Подписываемся на свойства события из (doro@web),
   * и одновременно ожидаем состояние события из (tik@web)
   * EventWithState = { eventProps, eventState }
   * */
  ngOnInit() {
    const initalState: EventViewState<EventStateResItemStateless> = {
      viewState: 'LOADING_VIEW_STATE',
      eventState: -1 // pending
    }
    this.eventState$ = 
      this.eventService.listenEventState(EventTypePrefix.BASIC, this.eventProps.id)
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

  playEvent(isGuiEvent = true): void {
    this.eventService.playEvent(this.eventProps.id, isGuiEvent)
  }

  pauseEvent() {
    this.eventService.pauseEvent(this.eventProps.id)
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  } 
}