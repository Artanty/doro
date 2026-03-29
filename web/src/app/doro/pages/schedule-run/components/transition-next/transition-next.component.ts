import { Component, OnInit, Input, ChangeDetectorRef, DestroyRef } from "@angular/core"
import { Observable, from, distinctUntilChanged, map, tap, startWith, catchError, of, lastValueFrom } from "rxjs"
import { eventTypes, INITIAL_VIEW_STATE, EventProgress, BASE_SCHEDULE_ID, DEFAULT_WORK_EVENT_LENGTH, DEFAULT_EVENT_STATE_HOOKS, DEFAULT_USER_BASE_ACCESS_ID } from "src/app/doro/constants"
import { dd } from "src/app/doro/helpers/dd"
import { Nullable } from "src/app/doro/helpers/utility.types"
import { CreateEventReq } from "src/app/doro/services/basic-event/basic-event-api.types"
import { EventService } from "src/app/doro/services/basic-event/basic-event.service"
import { EventProps, EventPropsWithState, EVENT_PROPS_KEY, EventStateHook } from "src/app/doro/services/basic-event/basic-event.types"
import { ApiService } from "src/app/doro/services/common-api/common-api.service"
import { ViewStatus, ViewState } from "src/app/doro/services/core/view-state.type"
import { SuggestRestReq } from "src/app/doro/services/schedule/schedule.api.types"
import { TransitionEventService } from "src/app/doro/services/transition-event/transition-event.service"
import { NextSuggestionsRes, NextCalculatedEvent } from "src/app/doro/services/transition-event/transition-event.types"
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';


@Component({
  selector: 'app-transition-next',
  templateUrl: './transition-next.component.html',
  styleUrl: './transition-next.component.scss',
  standalone: false,
})
export class TransitionNextComponent implements OnInit {
  eventTypes = eventTypes
  ViewStatus = ViewStatus
  public endedEvent!: EventProps
  public nextEventBySchedule?: EventProps
  public nextCalculatedEvent: any
  
  @Input() public data!: EventPropsWithState;

  public view$!: Observable<ViewState<NextEventViewData>>

  constructor(
    private cdr: ChangeDetectorRef,
    private _eventService: EventService,
    private _transitionEventService: TransitionEventService,
    private _api: ApiService,
    private _basicEventService: EventService,
    private destroyRef: DestroyRef
  ) {}

  ngOnInit(): void {
    this.view$ = of(this._getNextActionSuggestions(this.data[EVENT_PROPS_KEY]))     
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        distinctUntilChanged((prev, curr) => {
          return JSON.stringify(prev) === JSON.stringify(curr);
        }),
        map((nextSuggestionsRes: NextSuggestionsRes) => {
          if (nextSuggestionsRes) {
            return {
              status: ViewStatus.READY,
              data: this._buildViewData(nextSuggestionsRes)
            }
          } else {
            return INITIAL_VIEW_STATE;
          }
        }),
        tap(() => this.cdr.detectChanges()),
        startWith(INITIAL_VIEW_STATE),
        catchError(error => {
          return of(this._buildErrorState(error))
        }),
      )
  }

  public getEventByHook(hookId: number): EventProps | undefined {
    const allEvents = this.data.allScheduleEventsUnfiltered;
    const foundParentEvent = allEvents.find(event => 
      event.state_hooks?.some(hook => hook.id === Number(hookId))
    );
    return foundParentEvent;
  }

  public getHookById(hookId: number): EventStateHook | undefined | any {
    return this.getEventByHook(hookId)?.state_hooks
      .find(hook => hook.id === Number(hookId));
  }

  private _getNextPositionInSchedule(scheduleId: number): number {

    const filteredBySchedule = this.data.allScheduleEvents;

    const sorted = filteredBySchedule.sort((a, b) => {
      return Number(b.schedule_position) - Number(a.schedule_position)
    });

    const removedNulls = sorted.filter(el => typeof el.schedule_position === 'number');

    const current = removedNulls[0]?.schedule_position;
    
    const result = typeof current === 'number'
      ? (current + 1)
      : 0;
    
    return result
  }

  private _getNextActionSuggestions(emptyEvent: EventProps): NextSuggestionsRes {
    const scheduleId: number = emptyEvent.schedule_id;

    let nextCalculatedEvent: NextCalculatedEvent = {
      type: eventTypes.WORK,
      length: DEFAULT_WORK_EVENT_LENGTH,
      schedule_id: scheduleId,
      schedule_position: this._getNextPositionInSchedule(scheduleId),
      debug: null,
    };

    return {
      endedEvent: emptyEvent,
      nextEventBySchedule: null,
      nextCalculatedEvent
    } as NextSuggestionsRes
  }
  
  

  private _buildErrorState(error: Error): ViewState<NextEventViewData> {
    dd(error)
    const errorState: ViewState<NextEventViewData> = {
      status: ViewStatus.ERROR,
      error: error.message
    };

    return errorState;
  }
   
  public finishTransitionAndDuplicateEvent(nextEventData: NextEventViewData) {
    // this._nextEventService.finishTransitionAndPlayDuplicatedEvent(
    //   this.id, nextEventData.endedEvent.id)
    //   .subscribe(res => {
    //     // this.location.back()
    //   })
  }
  
  public finishTransitionAndClose() {
    // this._eventService.finishEvent(this.id).subscribe(res => {
    //   // this.router.navigateByUrl('/doro/event-list')
    // })
  }

  public startNextEvent(nextEventData: NextEventViewData): void {
    dd(nextEventData)
    if (nextEventData.startNewEventType === 'create') {

      const eventToCreate: CreateEventReq = {
        name: `empty event`,
        length: nextEventData.length,
        type: nextEventData.type,
        base_access: DEFAULT_USER_BASE_ACCESS_ID,
        state: EventProgress.PLAYING,
        hooks: DEFAULT_EVENT_STATE_HOOKS,
        schedule_id: nextEventData.endedEvent.schedule_id,
      };
      this._basicEventService
        .createEvent(eventToCreate)
        .subscribe(res => {
          dd(res);
          // this.location.back()
        });
    } else {
      dd('play next - not implemented')
    }    
  }

  private _buildViewData(nextSuggestionsRes: NextSuggestionsRes): NextEventViewData {
    dd('_buildViewData')
    dd(nextSuggestionsRes)
    const result: NextEventViewData = {
      type: eventTypes.REST,
      length: 0,
      startNewEventType: 'create',
      endedEvent: nextSuggestionsRes.endedEvent
    }
    if (nextSuggestionsRes.nextEventBySchedule) {
      result.type = nextSuggestionsRes.nextEventBySchedule.type as any;
      result.length = nextSuggestionsRes.nextEventBySchedule.length;
      result.startNewEventType = 'play';
    } else if (nextSuggestionsRes.nextCalculatedEvent) {
      result.type = nextSuggestionsRes.nextCalculatedEvent.type;
      result.length = nextSuggestionsRes.nextCalculatedEvent.length;
      result.startNewEventType = 'create';
    } else {
      throw new Error('wrong state of app')
    }
    dd('suggestion:')
    dd(result)
    return result;

    
  }
}

export interface NextEventViewData {
  type: typeof eventTypes[keyof typeof eventTypes],
  length: number,
  startNewEventType: 'create' | 'play',
  endedEvent: EventProps,
}