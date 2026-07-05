import { Component, OnInit, OnDestroy, ChangeDetectorRef, Injector, DestroyRef } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { Subject, Observable, takeUntil, take, map, combineLatest, switchMap, tap, startWith, of, catchError, BehaviorSubject, concatMap, EMPTY } from "rxjs";

import { dd } from "@helpers/dd";
import { Nullable } from "@helpers/utility.types";
import { EventService } from "@services/basic-event/basic-event.service";

import { AppStateService } from "@services/core/app-state.service";
import { ViewState, ViewStatus } from "@services/core/view-state.type";
import { getEmptyEventProps, getEmptyEventState } from "../transition-next/transition-next.helper";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { EventPropsWithState, EVENT_PROPS_KEY, EVENT_STATE_KEY, EventProps, EventStateResItem, Schedule } from "@services/basic-event/basic-event.types";
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
   * ev.playhead === ev.length
   */
  ngOnInit() {
    this.route.params.subscribe(res => {
      this._initView(res);
      this.currentSchedule.next(Number(res['scheduleId']))
    })
  }

  private _initView (routeParams: any) {
    combineLatest([
      this._state.schedules.listen(),
      this._state.events.listen(),
      of(routeParams)
    ])
    .pipe(
        takeUntilDestroyed(this.destroyRef),
        map(([schedules, events, routeParams]) => {
          
          this.scheduleId = Number(routeParams['scheduleId']);
          if (!this.scheduleId) throw new Error('no schedule id');
          
          const schedule = schedules.find((s: any) => s.id === this.scheduleId);
          if (!schedule) throw new Error(`Нет расписания ${this.scheduleId}`);
          
          const scheduleEvents = events.filter((e: any) => e.schedule_id === this.scheduleId);
          if(!scheduleEvents.length) throw new Error(`no events in schedule ${this.scheduleId}`);
          
          //todo sort events !
          const currentState = this._calculateCurrentState(schedule, scheduleEvents);

          return currentState;
        }),
        switchMap((res: ScheduleState) => {
          /**
           * Приоритетный конфиг - doro@
           * Если ничего не проигрывается, то tik@ мы не слушаем
           * и, значит нужно вывести или транзишн, или конечный экран.
           */
          if(res.state === 'PLAYING') {
            return this._eventService.listenEventState(EventTypePrefix.BASIC, res.result.id)
              .pipe(map(tikRes => {
                return {
                  state: tikRes,
                  props: res.result
                }
              }))
          } else {
            return of({
              state: {
                id: 'tikEventId', // no need here
                cur: res.result.playhead,
                len: res.result.length,
                stt: EventProgress.STOPPED
              },
              props: res.result
            })
          }
        }),
        tap((res: { state: EventStateResItem, props: any }) => {
          const result: ViewState<EventPropsWithState> = {
            status: ViewStatus.READY,
            data: {
              [EVENT_PROPS_KEY]: res.props,
              [EVENT_STATE_KEY]: res.state,
              allScheduleEvents: [],
              allScheduleEventsUnfiltered: [],
            }
          };
          this.view$.next(result)
        }),
        startWith(INITIAL_VIEW_STATE),
        catchError((err: any) => {
          this.view$.next({ status: ViewStatus.ERROR, error: err.message })
          return EMPTY;
        }),
      )
      .subscribe()
  }
  public goToScheduleRun(data: any) {
    const scheduleId = Number(data)
    this.router.navigate(
      [`doro/schedule-run/${scheduleId}`],
    );
  }

  public deleteCurrentSchedule () {
    this._scheduleService.deleteSchedule(this.scheduleId).subscribe(res =>{
      dd('schedule delete result')
      dd(res);
      // todo some reload...
    })
  }

  //todo EventProps -> GetEventResDataItem
  private _calculateCurrentState (schedule: any, events: GetEventResDataItem[] | any[]): ScheduleState { 
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
      const nextEvent = events
        .filter(e => e.playhead < e.length)[0];
      
      if (!nextEvent) throw new Error (`Нет доступных ивентов расписания ${schedule.active_event_id}`);

      res.state = 'READY_TO_START'
      res.result = nextEvent
    }

    // определяем, транзишн ли
    if (!schedule.is_playing && activeEvent) {

      // определяем закончился ивент или пауза
      const isStopped = activeEvent.playhead === activeEvent.length;
      if (isStopped) {
        // ивент остановлен, он дошел до конца,
        // осталось проверить, если следующий ивент для переключения, 
        // или расписание отыграно полностью.
        // предполагаем, что ивенты отсортированы по position.
        // ивенты могли быть вызаны не по порядку, так что удаляем законченные
        const nextEvent = events
          .filter(e => e.playhead < e.length)
          .find(e => activeEvent!.schedule_position < e.schedule_position);

        if (nextEvent) {
          res.state = 'NEED_TRANSITION';
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
