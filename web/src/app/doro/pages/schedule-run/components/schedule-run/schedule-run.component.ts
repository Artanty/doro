import { Component, OnInit, OnDestroy, ChangeDetectorRef, Injector, DestroyRef } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { Subject, Observable, takeUntil, take, map, combineLatest, switchMap, tap, startWith, of, catchError, BehaviorSubject, concatMap, EMPTY, skip, from } from "rxjs";
import { dd } from "@helpers/dd";
import { Nullable } from "@helpers/utility.types";
import { EventService } from "@services/basic-event/basic-event.service";
import { AppStateService } from "@services/core/app-state.service";
import { ViewState, ViewStatus } from "@services/core/view-state.type";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { EventPropsWithState, EVENT_PROPS_KEY, EVENT_STATE_KEY, SCHEDULE_STATE_KEY, EventProps, EventStateResItem, Schedule } from "@services/basic-event/basic-event.types";
import { eventTypes, EventProgress, EventTypePrefix, INITIAL_VIEW_STATE } from "../../../../constants";
import { GetEventResDataItem } from "@contracts/event.contract";
import { ScheduleService } from "@services/schedule/schedule.service";

export interface ScheduleState {
  state: any,
  result: any
}

@Component({
  selector: 'app-schedule-run',
  standalone: false,
  templateUrl: './schedule-run.component.html',
  styleUrl: './schedule-run.component.scss'
})
export class ScheduleRunComponent implements OnInit, OnDestroy {
  public scheduleMenuItems$: Observable<Schedule[]>
  private destroy$ = new Subject<void>();
  view$ = new BehaviorSubject<ViewState<EventPropsWithState>>(INITIAL_VIEW_STATE);
  EVENT_PROPS_KEY = EVENT_PROPS_KEY;
  EVENT_STATE_KEY = EVENT_STATE_KEY;
  SCHEDULE_STATE_KEY = SCHEDULE_STATE_KEY;
  ViewStatus = ViewStatus;
  eventTypes = eventTypes;
  Number = Number;
  scheduleId!: number;
  currentSchedule: any = new BehaviorSubject<number | string>(0)
  constructor(
    private cdr: ChangeDetectorRef,
    private _eventService: EventService,
    private injector: Injector,
    private route: ActivatedRoute,
    private router: Router,
    private _state: AppStateService,
    private destroyRef: DestroyRef,
    private _scheduleService: ScheduleService
  ) {
    this.scheduleMenuItems$ = this._state.schedules.listen()
  }

  /**
   * Подписываемся на ивенты, скедьюлы, тик стейт
   * проверяем есть ли скедьюл по ид - `Нет расписания ${scheduleId}`
   * проверяем есть ли ивены этого скедьюл - `Нет ивентов в расписании ${scheduleId}`
   * проверяем есть ли is_playing ивены этого скедьюл - `Нет ивентов для старта`
   * 
   * берем найденный event (должен быть один), смотрим на его тип is_rest
   * если отдых - показываем отдых
   * если работа - показываем работу
   * 
   * как понять, что сейчас транзишн:
   * sk.active_event_id !== -1 &&
   * sk.is_playing = false &&
   * sk_ev.playhead === ev.length
   */
  ngOnInit() {
     combineLatest([
      this._state.schedules.listen(),
      this._state.events.listen(),
      this.route.params
    ])
     .pipe(
        takeUntilDestroyed(this.destroyRef),
     )
    .subscribe(res => {
      this._initView(res);
      this.currentSchedule.next(Number(res[2]['scheduleId']))
      this.cdr.detectChanges()
    })
  }

  private _initView ([schedules, events, routeParams]: any) {
    of([schedules, events, routeParams])
    .pipe(
      takeUntilDestroyed(this.destroyRef),
      map(([schedules, events, routeParams]) => {
        this.scheduleId = Number(routeParams['scheduleId']);
        if (!this.scheduleId) throw new Error('no schedule id');
        
        const schedule = schedules.find((s: any) => s.id === this.scheduleId);
        if (!schedule) throw new Error(`Нет расписания ${this.scheduleId}`);
        
        const scheduleEvents = events.filter((e: any) => e.schedule_id === this.scheduleId);
        if(!scheduleEvents.length) throw new Error(`no events in schedule ${this.scheduleId}`);
        
        const scheduleEventsSorted = [...scheduleEvents].sort((a, b) => a.schedule_position - b.schedule_position);
        const currentState = this._calculateCurrentState(schedule, scheduleEventsSorted);
        
        return { currentState };
      }),
        switchMap(({ currentState }: { currentState: ScheduleState }) => {
          if(currentState.state === 'PLAYING') {
            const listenEventProps = {
              id: currentState.result.id,
              is_active_event: currentState.result.is_active_event,
              schedule_is_playing: currentState.result.schedule_is_playing,
              schedule_event_playhead: currentState.result.schedule_event_playhead,
              length: currentState.result.length
            }
            return this._eventService.listenEventState(EventTypePrefix.BASIC, listenEventProps)
              .pipe(map(tikRes => ({
                tikState: tikRes,
                scheduleState: currentState.state,
                props: currentState.result,
              })))
          } else {
            return of({
              tikState: {
                id: 'tikEventId',
                cur: currentState.result?.schedule_event_playhead ?? 0,
                len: currentState.result?.length ?? 0,
                stt: EventProgress.STOPPED
              },
              scheduleState: currentState.state,
              props: currentState.result,
            })
          }
        }),
        tap((res: { tikState: EventStateResItem, scheduleState: any, props: any }) => {
          const result: ViewState<EventPropsWithState> = {
            status: ViewStatus.READY,
            data: {
              [EVENT_PROPS_KEY]: res.props,
              [EVENT_STATE_KEY]: res.tikState,
              [SCHEDULE_STATE_KEY]: res.scheduleState,
            }
          };
          this.view$.next(result)
          this.cdr.detectChanges()
        }),
        startWith(INITIAL_VIEW_STATE),
        catchError((err: any) => {
          this.view$.next({ status: ViewStatus.ERROR, error: err.message })
          return EMPTY;
        }),
      )
      .subscribe()
  }
  
  public goToScheduleRun(data: any): Observable<boolean> {
    const scheduleId = Number(data)
    const promise = this.router.navigate(
      [`doro/schedule-run/${scheduleId}`],
    );

    return from(promise)
  }

  public deleteCurrentSchedule () {
    this.view$.next(INITIAL_VIEW_STATE)
    this._scheduleService.deleteSchedule(this.scheduleId)
    .pipe(
      takeUntilDestroyed(this.destroyRef),
      map(res => {
        if (!res.data.success) {
          throw new Error(res.error)
        }
      }),
      switchMap(() => {
        return this._state.configHashSchedules.listen();
      }),
      switchMap(() => {
        return this._state.schedules.listen()
      }),
      switchMap((schedules: any[]) => {
        if (schedules.length) {
          return this.goToScheduleRun(schedules[0].id)
        }
        // trigger not found error:
        return this.goToScheduleRun(this.scheduleId)
      }),
      catchError((err: any) => {
        this.view$.next({ status: ViewStatus.ERROR, error: err.message })
        return EMPTY;
      }),
    )
    .subscribe(res =>{
      dd(res)
    })
  }

  private _calculateCurrentState (
    schedule: any,
    events: GetEventResDataItem[]
  ): ScheduleState { 
    const res: any = {
      state: null,
      result: null
    }

    let activeEvent: Nullable<GetEventResDataItem> = null;

    // какой-то ивент активен, т е скедьюл стартовал
    if (schedule.active_event_id && schedule.active_event_id !== -1) {
      activeEvent = events.find(e => e.id === schedule.active_event_id) ?? null;
      if (!activeEvent) throw new Error (`Не найден активный ивент ${schedule.active_event_id}`);
    }

    // нет активного ивента, т е скедьюл еще не стартовал
    // или активный ивент был удалён, поэтому
    if (schedule.active_event_id === -1) {
      // предполагаем, что ивенты отсортированы по position.
      // удаляем законченные
      const nextEvent = events[0];
      
      if (!nextEvent) throw new Error (`Нет доступных ивентов расписания ${schedule.active_event_id}`);

      res.state = 'READY_TO_START'
      res.result = nextEvent
    }

    // определяем, транзишн ли
    if (!schedule.is_playing && activeEvent) {
      // определяем закончился ивент или пауза
      const isStopped = activeEvent.schedule_event_playhead === activeEvent.length;
      if (isStopped) {
        const nextEvent = events
          .find(e => activeEvent!.schedule_position < e.schedule_position);
        if (nextEvent) {
          res.state = 'TRANSITION';
          res.result = nextEvent;
        } else {
          res.state = 'SCHEDULE_ENDED';
        }
      } else { // ивент на паузе   
        res.state = 'PAUSED',
        res.result = activeEvent
      }
    }

    if (schedule.is_playing && activeEvent) {
      res.state = 'PLAYING'
      res.result = activeEvent
    }

    return res;  
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
