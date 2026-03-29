import { Component, OnInit, OnDestroy, ChangeDetectorRef, Injector, DestroyRef } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Subject, Observable, takeUntil, take, map, combineLatest, switchMap, tap, startWith, of } from "rxjs";
import { eventTypes, EventProgress, EventTypePrefix, INITIAL_VIEW_STATE } from "src/app/doro/constants";
import { dd } from "src/app/doro/helpers/dd";
import { Nullable } from "src/app/doro/helpers/utility.types";
import { EventService } from "src/app/doro/services/basic-event/basic-event.service";
import { EventPropsWithState, EVENT_PROPS_KEY, EVENT_STATE_KEY, EventProps } from "src/app/doro/services/basic-event/basic-event.types";
import { AppStateService } from "src/app/doro/services/core/app-state.service";
import { ViewState, ViewStatus } from "src/app/doro/services/core/view-state.type";
import { getEmptyEventProps, getEmptyEventState } from "../transition-next/transition-next.helper";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
  selector: 'app-schedule-run',
  standalone: false,
  templateUrl: './schedule-run.component.html',
  styleUrl: './schedule-run.component.scss'
})
export class ScheduleRunComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  view$!: Observable<ViewState<EventPropsWithState>>;
  EVENT_PROPS_KEY = EVENT_PROPS_KEY;
  EVENT_STATE_KEY = EVENT_STATE_KEY;
  ViewStatus = ViewStatus;
  eventTypes = eventTypes;
  Number = Number;
  scheduleId!: number;
  constructor(
    private cdr: ChangeDetectorRef,
    private _eventService: EventService,
    private injector: Injector,
    private route: ActivatedRoute,
    private _state: AppStateService,
    private destroyRef: DestroyRef
  ) {}

  ngOnInit() {
    this.view$ = combineLatest([
      this._state.events.listenReal(),
      this.route.params.pipe(take(1)),
    ])
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        map(([events, routeParams]) => {
          this.scheduleId = Number(routeParams['scheduleId']);
          if (!this.scheduleId) throw new Error('no schedule id');
          
          const filteredEvents = events.filter(e => e.schedule_id === this.scheduleId);
          const sortedEvents = this._sortScheduleEvents(filteredEvents);
          return sortedEvents;
        }),
        switchMap((events: EventProps[]) => {
          const allScheduleEventsUnfiltered = events;
          const eventsToDisplay = events.filter(e => e.event_state_id !== EventProgress.COMPLETED);
          dd(allScheduleEventsUnfiltered)
          if (!eventsToDisplay.length) {
            // throw new Error('no events to display. need suggestion');
            const res: ViewState<EventPropsWithState> = {
              status: ViewStatus.READY,
              data: {
                [EVENT_PROPS_KEY]: getEmptyEventProps(this.scheduleId),
                [EVENT_STATE_KEY]: getEmptyEventState(),
                allScheduleEvents: [],
                allScheduleEventsUnfiltered: allScheduleEventsUnfiltered,
              }
            };
            return of(res);
          }

          const currentEvent = eventsToDisplay[0];

          const eventTypePrefix = currentEvent.type === eventTypes.TRANSITION
            ? EventTypePrefix.TRANSITION
            : EventTypePrefix.BASIC;
  
          return this._eventService.listenEventState(eventTypePrefix, currentEvent.id)
            .pipe(
              // todo add build suggestion
              map((state: any) => {
                const res: ViewState<EventPropsWithState> = {
                  status: ViewStatus.READY,
                  data: {
                    [EVENT_PROPS_KEY]: currentEvent,
                    [EVENT_STATE_KEY]: state,
                    allScheduleEvents: eventsToDisplay,
                    allScheduleEventsUnfiltered: allScheduleEventsUnfiltered,
                  }
                };
                return res;
              }),
              tap(() => {
                // dd('inner tap')
              })
            );
        }),
        tap(res => {
          // dd('outer tap')
          setTimeout(() => {
            this.cdr.detectChanges()
          }, 1000); // crutch to update state
        }),
        startWith(INITIAL_VIEW_STATE),
      );
  }

  /**
   * показываем первый (по updated_at) незаконченный ивент
   * или первый созданный (по created_at)
   * Если есть ивент тайп=3 (транзишн) - показываем первый попавшийся.
   * */
  private _sortScheduleEvents(events: EventProps[]) {
    const sortedNewestFirst = [...events].sort((a, b) => {

      if (!!a.updated_at !== !!b.updated_at) {
        return a.updated_at ? -1 : 1;
      }
    
      const dateA = a.updated_at || a.created_at;
      const dateB = b.updated_at || b.created_at;

      return dateA.localeCompare(dateB);
    });

    return this.sortAndFilterTransitions(sortedNewestFirst);
  }
  
  sortAndFilterTransitions<T extends { type: number, event_state_id: number }>(array: T[]): T[] {
    array = array.filter(item => {
      if (item.type === eventTypes.TRANSITION && item.event_state_id === EventProgress.COMPLETED) {
        return false;
      } else {
        return true;
      }
    });

    const index = array.findIndex(item => item.type === 3);
    
    if (index === -1) return [...array]; // No item with type 3, return copy
    
    const newArray = [...array];
    const [type3Item] = newArray.splice(index, 1);
    newArray.unshift(type3Item);
    
    return newArray;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
