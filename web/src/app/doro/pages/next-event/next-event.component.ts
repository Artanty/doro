import { ChangeDetectorRef, Component, EventEmitter, Injector, Input, OnInit, Output } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DEFAULT_EVENT_STATE_HOOKS, EventProgress, EventStates, EventTypePrefix, eventTypes, INITIAL_VIEW_STATE } from '../../constants';
import { BehaviorSubject, catchError, combineLatest, distinctUntilChanged, from, map, Observable, of, startWith, switchMap, take, takeUntil, tap, throwError } from 'rxjs';
import { countPrc } from '../../helpers/count-percent.util';
import { EventService } from '../../services/event.service';
import { dd } from '../../helpers/dd';
import { NextEventService } from '../../services/next-event.service';
import { NextSuggestionsRes } from '../../services/next-event/next-event.types';
import { ViewState, ViewStatus } from '../../types/view-state.type';
import { EventProps } from '../../services/event/event.types';
import { CreateEventReq } from '../../services/api/event.types.api';

@Component({
  selector: 'app-next-event',
  templateUrl: './next-event.component.html',
  styleUrl: './next-event.component.scss',
  standalone: false,
})
export class NextEventComponent implements OnInit {
  eventTypes = eventTypes
  ViewStatus = ViewStatus
  public endedEvent!: EventProps
  public nextEventBySchedule?: EventProps
  public nextCalculatedEvent: any
 
  @Output() public playNextAway = new EventEmitter<void>()
  @Output() public playFirstAway = new EventEmitter<void>()
  transitionEventId!: number;
  public view$: Observable<ViewState<NextEventViewData>>
  constructor(
    // private router: Router,
    private location: Location,
    private cdr: ChangeDetectorRef,
    private _eventService: EventService,
    private injector: Injector,
    private route: ActivatedRoute,
    private _nextEventService: NextEventService,
  ) {
    this.transitionEventId = Number(this.route.snapshot.params['transitionEventId'])
    dd('now')
    this.view$ = combineLatest([
      this._eventService.listenEventState(EventTypePrefix.TRANSITION, this.transitionEventId),
      from(this._nextEventService.getNextActionSuggestions(this.transitionEventId))
    ])      
      .pipe(
        distinctUntilChanged((prev, curr) => {
          const [prevState, prevSuggestions] = prev;
          const [currState, currSuggestions] = curr;
          
          return JSON.stringify(prevSuggestions) === JSON.stringify(currSuggestions);
        }),
        map(([eventStateReqItem, nextSuggestionsRes]) => { // [EventStateReqItem, NextSuggestionsRes]
          dd('eventStateReqItem')
          dd(eventStateReqItem)
          dd('nextSuggestionsRes')
          dd(nextSuggestionsRes)
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
        tap(res => dd(res)),
      )
  }
  
  ngOnInit(): void {
    // this._eventService.loadEvents().pipe(take(1)).subscribe(() => this.init())
  }

  public replay() {
    // this._eventService.playEventApi({ eventId: this.endedEvent.id })
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
      this.transitionEventId, nextEventData.endedEvent.id)
      .subscribe(res => {
        this.location.back()
      })
  }
  
  public finishTransitionAndClose() {
    this._eventService.finishEvent(this.transitionEventId).subscribe(res => {
      dd(res);
      this.location.back()
    })
  }

  public finishTransitionAndStartNextEvent(nextEventData: NextEventViewData): void {
    dd(nextEventData)
    if (nextEventData.startNewEventType === 'create') {

      const transitionIdToFinish: number = this.transitionEventId;
      const eventToCreate: CreateEventReq = {
        name: `next calc from: ${this.transitionEventId}`,
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
    const result: NextEventViewData = {
      type: eventTypes.REST,
      length: 0,
      startNewEventType: 'create',
      endedEvent: nextSuggestionsRes.endedEvent
    }

    if (nextSuggestionsRes.nextCalculatedEvent) {
      result.type = nextSuggestionsRes.nextCalculatedEvent.type;
      result.length = nextSuggestionsRes.nextCalculatedEvent.length;
      result.startNewEventType = 'create';
    }
    return result;
  }
}

export interface NextEventViewData {
  type: typeof eventTypes[keyof typeof eventTypes],
  length: number,
  startNewEventType: 'create' | 'play',
  endedEvent: EventProps,
}