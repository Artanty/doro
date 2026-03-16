import { ChangeDetectorRef, Component, EventEmitter, Injector, Input, OnInit, Output } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { EventProps, EventState, EventStateResItem, EventStateResItemStateless, EventViewState } from '../../services/event.types';
import { EventStates, EventTypePrefix } from '../../constants';
import { BehaviorSubject, catchError, map, Observable, startWith, takeUntil, tap, throwError } from 'rxjs';
import { countPrc } from '../../helpers/count-percent.util';
import { EventService } from '../../services/event.service';

@Component({
  selector: 'app-next-event',
  templateUrl: './next-event.component.html',
  styleUrl: './next-event.component.scss',
  standalone: false,
})
export class NextEventComponent implements OnInit {
  @Input() public endedEvent: any = null
  @Input() public nextEvent: any = null
  @Output() public playNextAway = new EventEmitter<void>()
  @Output() public playFirstAway = new EventEmitter<void>()

  eventState$!: Observable<EventViewState<EventStateResItem>>;
  eventProps!: EventProps;
  
  constructor(
    // private route: ActivatedRoute
    private cdr: ChangeDetectorRef,
    private eventService: EventService,
    private injector: Injector,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    let initalState: EventViewState<EventStateResItemStateless> | EventViewState<EventState> = {
      viewState: 'LOADING_VIEW_STATE',
      eventState: -1 // pending
    }
    const eventProps = this.route.snapshot.data['event']; // todo rewrite to load method & add refresh
    // dd('eventProps')
    // dd(eventProps)
    if (eventProps) {
      this.eventProps = eventProps;
    }
    if (!this.eventProps?.id) {
      initalState = this._buildErrorState(new Error('no event id, mb forgot resolver'));
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
  
}
