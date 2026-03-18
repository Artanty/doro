import { ChangeDetectorRef, Component, EventEmitter, Injector, Input, OnInit, Output } from '@angular/core';
import { Location } from '@angular/common';

import { ActivatedRoute, Router } from '@angular/router';
import { EventProps, EventState, EventStateReqItem, EventStateResItem, EventStateResItemStateless, EventViewState } from '../../services/event.types';
import { EventStates, EventTypePrefix, eventTypes, INITIAL_VIEW_STATE } from '../../constants';
import { BehaviorSubject, catchError, combineLatest, from, map, Observable, of, startWith, switchMap, take, takeUntil, tap, throwError } from 'rxjs';
import { countPrc } from '../../helpers/count-percent.util';
import { EventService } from '../../services/event.service';
import { dd } from '../../helpers/dd';
import { NextEventService } from '../../services/next-event.service';
import { NextSuggestionsRes } from '../../services/next-event/next-event.types';
import { ViewState, ViewStatus } from '../../types/view-state.type';

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

    this.view$ = combineLatest([
      this._eventService.listenEventState(EventTypePrefix.TRANSITION, this.transitionEventId),
      from(this._nextEventService.getNextActionSuggestions(this.transitionEventId))
    ])      
      .pipe(
        map(([eventStateReqItem, nextSuggestionsRes]) => { // [EventStateReqItem, NextSuggestionsRes]
          if (nextSuggestionsRes) {
            return {
              status: ViewStatus.READY,
              data: this._buildViewData(nextSuggestionsRes)
            }
          } else {
            return INITIAL_VIEW_STATE;
          }
        }),
        startWith(INITIAL_VIEW_STATE),
        catchError(error => {
          return of(this._buildErrorState(error))
        })
      )
  }
  /**
   * получаем ид
   * идем в сервис, чтоб понять, что показывать.
   * */
  ngOnInit(): void {
    this._eventService.loadEvents().pipe(take(1)).subscribe(() => this.init())
  }

  async init() {
    if (this.transitionEventId) {
      const suggestions: NextSuggestionsRes = await this._nextEventService.getNextActionSuggestions(this.transitionEventId);
      
      if (suggestions.nextEventsBySchedule.length > 0) {
        this.nextEventBySchedule = suggestions.nextEventsBySchedule[0];
      }

      if (suggestions.nextCalculatedEvent) {
        this.nextCalculatedEvent = suggestions.nextCalculatedEvent;
      }

      if (suggestions.endedEvent) {
        this.endedEvent = suggestions.endedEvent;
      }
      dd(this.transitionEventId)
      dd(suggestions)
      this.cdr.detectChanges();
    }
    
    // .subscribe();
  }

  public replay() {
    this._eventService.playEventApi({ eventId: this.endedEvent.id })
  }

  private _buildErrorState(error: Error): ViewState<NextEventViewData> {
    dd(error)
    const errorState: ViewState<NextEventViewData> = {
      status: ViewStatus.ERROR,
      error: error.message
    };

    return errorState;
  }
   
  public finishTransitionAndDuplicateEvent() {}
  
  public finishTransitionAndClose() {
    this._eventService.finishEvent(this.transitionEventId).subscribe(res => {
      dd(res);
      this.location.back()
    })
  }

  public finishTransitionAndStartNextEvent() {
    if (this.nextEventBySchedule?.id) {
      const idToFinish = this.transitionEventId;
      this._nextEventService.finishTransitionAndStartNextEvent(idToFinish, this.nextEventBySchedule.id)
        .subscribe(res => {
          dd(res)
          this.location.back()
        })
    } else {

    }
  }

  private _buildViewData(nextSuggestionsRes: NextSuggestionsRes): NextEventViewData {
    const result: NextEventViewData = {
      type: eventTypes.REST,
      length: 0,
    }

    if (nextSuggestionsRes.nextCalculatedEvent) {
      result.type = nextSuggestionsRes.nextCalculatedEvent.type;
      result.length = nextSuggestionsRes.nextCalculatedEvent.data!.restDuration
    }
    return result;
  }
}

export interface NextEventViewData {
  type: typeof eventTypes[keyof typeof eventTypes],
  length: number,
}