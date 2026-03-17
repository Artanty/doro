import { ChangeDetectorRef, Component, EventEmitter, Injector, Input, OnInit, Output } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { EventProps, EventState, EventStateResItem, EventStateResItemStateless, EventViewState } from '../../services/event.types';
import { EventStates, EventTypePrefix } from '../../constants';
import { BehaviorSubject, catchError, map, Observable, startWith, switchMap, takeUntil, tap, throwError } from 'rxjs';
import { countPrc } from '../../helpers/count-percent.util';
import { EventService } from '../../services/event.service';
import { dd } from '../../helpers/dd';
import { NextEventService } from '../../services/next-event.service';

@Component({
  selector: 'app-next-event',
  templateUrl: './next-event.component.html',
  styleUrl: './next-event.component.scss',
  standalone: false,
})
export class NextEventComponent implements OnInit {
  public endedEvent!: EventProps
  public nextEvent!: EventProps
 
  @Output() public playNextAway = new EventEmitter<void>()
  @Output() public playFirstAway = new EventEmitter<void>()

  eventState$!: Observable<EventViewState<EventStateResItem>>;
  eventProps!: EventProps;
  eventId!: number 
  constructor(
    // private route: ActivatedRoute
    private cdr: ChangeDetectorRef,
    private eventService: EventService,
    private injector: Injector,
    private route: ActivatedRoute,
    private _nextEventService: NextEventService
  ) {}
  /**
   * получаем ид
   * идем в сервис, чтоб понять, что показывать.
   * */
  ngOnInit(): void {
    
    this.eventService.loadEvents().subscribe(() => this.init())
    
  }

  init() {
    let initalState: EventViewState<EventStateResItemStateless> | EventViewState<EventState> = {
      viewState: 'LOADING_VIEW_STATE',
      eventState: -1 // pending
    }
    this.eventId = Number(this.route.snapshot.params['transitionEventId'])
    dd('transitionEventId')
    dd(this.eventId)
    if (this.eventId) {
      const suggessions = this._nextEventService.getNextActionSuggessions(this.eventId);
      if (suggessions.nextEventsBySchedule) {
        this.nextEvent = suggessions.nextEventsBySchedule[0];
      }
      if (suggessions.endedEvent) {
        this.endedEvent = suggessions.endedEvent;
      }
      dd(suggessions)
      this.cdr.detectChanges()
    }
    this.eventState$ = 
      this.eventService.listenEventState(EventTypePrefix.TRANSITION, this.eventProps?.id)
        .pipe(
          // takeUntil(this.destroy$),
          map((res: EventStateResItem) => {
            const { stt, len, cur, id } = res;
            const readyState: EventViewState<EventStateResItemStateless> = {
              viewState: 'READY_VIEW_STATE',
              eventState: stt,
              data: {
                id,
                cur,
                len,
                prc: countPrc(len!, cur),
              }              
            };

            return readyState;
          }),
          startWith(initalState),
          tap((res: any) => {
            // dd('go')
            // dd(res)
            this.cdr.detectChanges()
          }),
          catchError(error => {
            console.error('Failed while listenEventState in list item:', error);
         
            return throwError(() => this._buildErrorState(error)) 

            // return EMPTY;
          })
        )
  }

  private _buildErrorState(error: Error): EventViewState<EventState> {
    const errorState: EventViewState<EventState> = {
      viewState: 'ERROR_VIEW_STATE',
      eventState: EventStates.ERROR,
      error: error.message
    };

    return errorState;
  }
  
  public finishEvent() {
    const id = this.eventId;
    this.eventService.finishEvent(id).subscribe(res => {
      dd('FINISHED')
    })
  }

}
