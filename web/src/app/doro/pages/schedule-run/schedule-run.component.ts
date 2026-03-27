import { ChangeDetectorRef, Component, Injector, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntil, take, switchMap, combineLatest, map, distinctUntilChanged, tap, Subject, Observable, BehaviorSubject } from 'rxjs';
import { dd } from '../../helpers/dd';
import { AppStateService } from '../../services/app-state.service';
import { EventService } from '../../services/event.service';
import { EventViewState, EventStateResItem, EventProps, EventPropsWithState, EVENT_STATE_KEY, EVENT_PROPS_KEY } from '../../services/event/event.types';
import { filterBasicEvents } from '../../helpers/filterBasicEvents';
import { Nullable } from '../../helpers/utility.types';
import { ViewState, ViewStatus } from '../../types/view-state.type';
import { EventProgress, EventStates, EventTypePrefix, eventTypes } from '../../constants';

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

  public events$?: Observable<EventProps[]>;
  scheduleFilter$: Observable<Nullable<number>>;
  constructor(
    private cdr: ChangeDetectorRef,
    private _eventService: EventService,
    private injector: Injector,
    private route: ActivatedRoute,
    private _state: AppStateService
  ) {
    this.scheduleFilter$ = this.route.params.pipe(
      takeUntil(this.destroy$),
      take(1),
      map(params => {
        const scheduleId = Number(params['scheduleId']);
        dd('scheduleId');
        dd(scheduleId);
        return scheduleId;
      })
    );
  }

  ngOnInit() {
    this.view$ = combineLatest([
      this._state.events.listenReal(),
      this.route.params.pipe(take(1)),
    ])
      .pipe(
        map(([events, routeParams]) => {
          dd(events)
          dd(routeParams)
          let filteredEvents = events
          const scheduleId = Number(routeParams['scheduleId']);
          if (scheduleId) {
            filteredEvents = filteredEvents.filter(e => e.schedule_id === scheduleId);
          }
          const sortedEvents = this._sortScheduleEvents(filteredEvents);
          return sortedEvents;
        }),
      
        switchMap((events: EventProps[]) => {
          const allScheduleEventsUnfiltered = events;
          const eventsToDisplay = events.filter(e => e.event_state_id !== EventProgress.COMPLETED);

          if (!eventsToDisplay.length) throw new Error('no events to display. need suggestion');

          const currentEvent = eventsToDisplay[0];

          const eventTypePrefix = currentEvent.type === eventTypes.TRANSITION
            ? EventTypePrefix.TRANSITION
            : EventTypePrefix.BASIC;
  
          return this._eventService.listenEventState(eventTypePrefix, currentEvent.id)
            .pipe(
              // todo add build suggestion
              map((state: any) => {
                return {
                  status: ViewStatus.READY,
                  data: {
                    [EVENT_PROPS_KEY]: currentEvent,
                    [EVENT_STATE_KEY]: state,
                    allScheduleEvents: eventsToDisplay,
                    allScheduleEventsUnfiltered: allScheduleEventsUnfiltered,
                  }
                } as ViewState<EventPropsWithState>;
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
        })
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
// this.eventState$ = this.route.params.pipe(
//   takeUntil(this.destroy$),
//   take(1),
//   switchMap(params => {
//     const eventId = Number(params['id']);
//     dd('Event ID from route:', eventId);
//     return combineLatest([
//       this._listenEventState(eventId),
//       this._listenEventProps(eventId),
//     ])
//       .pipe(
//         takeUntil(this.destroy$),
//         map(([state]) => state),
//         distinctUntilChanged((prev, curr) => {
//           return JSON.stringify(prev) === JSON.stringify(curr);
//         }),
//         tap(res => dd(res))
//       );
//   })
// )