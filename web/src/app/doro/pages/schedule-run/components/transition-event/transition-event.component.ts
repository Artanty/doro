import { Component, OnInit, Input, Output, ChangeDetectorRef, Injector } from "@angular/core"
import { ActivatedRoute, Router } from "@angular/router"
import * as EventEmitter from "events"
import { Observable, combineLatest, from, distinctUntilChanged, map, tap, startWith, catchError, of, lastValueFrom } from "rxjs"
import { eventTypes, EventTypePrefix, INITIAL_VIEW_STATE, EventProgress, DEFAULT_EVENT_STATE_HOOKS, BASE_SCHEDULE_ID, DEFAULT_WORK_EVENT_LENGTH } from "src/app/doro/constants"
import { dd } from "src/app/doro/helpers/dd"
import { Nullable } from "src/app/doro/helpers/utility.types"
import { ApiService } from "src/app/doro/services/api.service"
import { CreateEventReq } from "src/app/doro/services/api/event.types.api"
import { SuggestRestReq } from "src/app/doro/services/api/schedule.types.api"
import { EventService } from "src/app/doro/services/event.service"
import { EVENT_PROPS_KEY, EventProps, EventPropsWithState } from "src/app/doro/services/event/event.types"
import { EventStateHook, NextEventService } from "src/app/doro/services/next-event.service"
import { NextCalculatedEvent, NextSuggestionsRes } from "src/app/doro/services/next-event/next-event.types"
import { ViewStatus, ViewState } from "src/app/doro/types/view-state.type"

@Component({
  selector: 'app-transition-event',
  templateUrl: './transition-event.component.html',
  styleUrl: './transition-event.component.scss',
  standalone: false,
})
export class TransitionEventComponent implements OnInit {
  eventTypes = eventTypes
  ViewStatus = ViewStatus
  public endedEvent!: EventProps
  public nextEventBySchedule?: EventProps
  public nextCalculatedEvent: any
  
  @Input() public data!: EventPropsWithState;

  public id!: number;
  public view$!: Observable<ViewState<NextEventViewData>>
  constructor(
    private cdr: ChangeDetectorRef,
    private _eventService: EventService,
    private injector: Injector,
    private route: ActivatedRoute,
    private router: Router,
    private _nextEventService: NextEventService,
    private _api: ApiService,
  ) {}

  ngOnInit(): void {
    this.id = this.data[EVENT_PROPS_KEY].id;
    this.view$ = from(this.getNextActionSuggestions(+this.id))     
      .pipe(
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

  /**
   * Отфильтровываем тот же тип события, чтобы после работы не шла работа.
   * */
  public getNextEventOfSchedule(scheduleId: number, event: EventProps): Nullable<EventProps> {

    const bySchedule = this.data.allScheduleEvents;
    bySchedule.sort((a, b) => {
      return Number(a.schedule_position) - Number(b.schedule_position)
    })
    const byPassed = bySchedule
      .filter(el => Number(el.schedule_position) > Number(event.schedule_position));

    const byState = byPassed
      .filter(el => el.event_state_id !== EventProgress.COMPLETED);

    const byType = byState
      .filter(el => el.type !== event.type);

    return byType[0] ?? null;
  }

  public getNextPositionInSchedule(scheduleId: number) {

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

  public async getNextActionSuggestions(transitionEventId: number): Promise<NextSuggestionsRes> {
    
    const transitionEvent = this.data[EVENT_PROPS_KEY];

    const createdFromId = transitionEvent.created_from; // e_324 or h_123
    const entityType = createdFromId.split('_')[0];
    const entityId = Number(createdFromId.split('_')[1]);
    if (entityType !== 'h') throw new Error(`Unknown entity type: ${entityType}`);
    const hook = this.getHookById(entityId);
    
    const isOnCompleteEvent = hook.trigger_event_state_id === EventProgress.COMPLETED;
    const isSuggestNext = hook.action_config?.scriptId === 'nextEvent';
    if (!isOnCompleteEvent || !isSuggestNext) throw new Error('unknown hook config');

    const creatorEvent = this.getEventByHook(hook.id);
    if (!creatorEvent) throw new Error('hook without parent - not implemented');
    const scheduleId = creatorEvent.schedule_id;
    if (!scheduleId) throw new Error('event without schedule - not implemented');

    const nextEventBySchedule = this.getNextEventOfSchedule(scheduleId, creatorEvent);
    /**
     * Если у расписания нет следующего события
     * Вычисляем его
     * */
    let nextCalculatedEvent: NextCalculatedEvent = {
      type: eventTypes.WORK,
      length: 0,
      schedule_id: BASE_SCHEDULE_ID,
      schedule_position: 9999,
      debug: null,
    };
    if (!nextEventBySchedule) {
      if (creatorEvent.type === eventTypes.REST) {
        // SUGGESTING WORK
        nextCalculatedEvent.type = eventTypes.WORK;
        // todo ask if schedule has settings. otherwise default
        nextCalculatedEvent.length = DEFAULT_WORK_EVENT_LENGTH;
      } else {
        // SUGGESTING REST
        nextCalculatedEvent.type = eventTypes.REST;
        const payload: SuggestRestReq = { scheduleId: creatorEvent.schedule_id }
        const suggestRestApiRes = await lastValueFrom(this._api.suggestRestApi(payload));
        nextCalculatedEvent.length = suggestRestApiRes.restDuration;
        nextCalculatedEvent.debug = { suggestRestApiRes };
      }
      nextCalculatedEvent.schedule_id = creatorEvent.schedule_id;
      nextCalculatedEvent.schedule_position = this.getNextPositionInSchedule(creatorEvent.schedule_id);
    }

    return {
      endedEvent: creatorEvent,
      nextEventBySchedule,
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
    this._nextEventService.finishTransitionAndPlayDuplicatedEvent(
      this.id, nextEventData.endedEvent.id)
      .subscribe(res => {
        // this.location.back()
      })
  }
  
  public finishTransitionAndClose() {
    this._eventService.finishEvent(this.id).subscribe(res => {
      // this.router.navigateByUrl('/doro/event-list')
    })
  }

  public finishTransitionAndStartNextEvent(nextEventData: NextEventViewData): void {
    dd(nextEventData)
    if (nextEventData.startNewEventType === 'create') {

      const transitionIdToFinish: number = this.id;
      const eventToCreate: CreateEventReq = {
        name: `next calc from: ${this.id}`,
        length: nextEventData.length,
        type: nextEventData.type,
        base_access: nextEventData.endedEvent.base_access_id,
        state: EventProgress.PLAYING,
        hooks: DEFAULT_EVENT_STATE_HOOKS,
        schedule_id: nextEventData.endedEvent.schedule_id,
      };
      this._nextEventService
        .finishTransitionAndCreateNextEvent(transitionIdToFinish, eventToCreate)
        .subscribe(res => {
          dd(res);
          // this.location.back()
        });
    } else {
      dd('play next - not implemented')
    }
    // if (this.nextEventBySchedule?.id) {
    //   const idToFinish = this.transitionEventId;
    //   this._nextEventService.finishTransitionAndStartNextEvent(idToFinish, this.nextEventBySchedule.id)
    //     .subscribe(res => {
    //       dd(res)
    //       this.location.back()
    //     })
    // } else {

    // }
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