import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Injector, Input, SimpleChanges } from '@angular/core';
import { Subject, Observable, takeUntil, map, startWith, tap, catchError, EMPTY, finalize, throwError, switchMap, combineLatest, distinctUntilChanged, take } from 'rxjs';
import { EventStates, EventTypePrefix } from 'src/app/doro/constants';
import { dd } from 'src/app/doro/helpers/dd';
import { ActivatedRoute } from '@angular/router';
import { EventService } from 'src/app/doro/services/event.service';
import { countPrc } from 'src/app/doro/helpers/count-percent.util';
import { EventProps, EventState, EventStateResItem, EventStateResItemStateless, EventViewState } from 'src/app/doro/services/event/event.types';
import { AppStateService } from 'src/app/doro/services/app-state.service';

@Component({
  selector: 'app-timer-wrapper',
  standalone: false,
  // imports: [],
  templateUrl: './timer-wrapper.component.html',
  styleUrl: './timer-wrapper.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimerWrapperComponent {
  // common
  // @Input() eventProps!: EventProps;
  eventProps!: EventProps;
  isDeleting$ = new Subject();
  menuItems = [
    { id: 'DELETE', name: 'Удалить' },
  ];
  
  eventState$!: Observable<EventViewState<EventStateResItem>>;
  public EventStates = EventStates;
  public eventStateNames: Record<number, string> = {
    [-1]: 'PENDING',
    [-2]: 'ERROR',
    [0]: 'STOPPED',
    [1]: 'PLAYING',
    [2]: 'PAUSED',
    [3]: 'COMPLETED'
  };
  private destroy$ = new Subject<void>();
  public eventState: any = null
  constructor(
    private cdr: ChangeDetectorRef,
    private eventService: EventService,
    private injector: Injector,
    private route: ActivatedRoute,
    private _store: AppStateService
  ) {
    // const service = this.injector.get(IconFallbackService);
    // console.log(service)
  }
  
  getPrc(eventState: any): number {
    const result = (eventState?.data?.cur && eventState?.data?.len)
      ? ((eventState?.data?.cur / eventState?.data?.len) * 100)
      : 0;
    return Math.round(result)
  }
  
  ngOnInit() {
    this.eventState$ = this.route.params.pipe(
      takeUntil(this.destroy$),
      take(1),
      switchMap(params => {
        const eventId = Number(params['id']);
        dd('Event ID from route:', eventId);
        return combineLatest([
          this._listenEventState(eventId),
          this._listenEventProps(eventId),
        ])
          .pipe(
            takeUntil(this.destroy$),
            map(([state]) => state),
            distinctUntilChanged((prev, curr) => {
              return JSON.stringify(prev) === JSON.stringify(curr);
            }),
            tap(res => dd(res))
          );
      })
    )
  }

  private _listenEventState(eventId: number): Observable<EventViewState<EventStateResItemStateless>> {
    let initalState: EventViewState<EventStateResItemStateless> | EventViewState<EventState> = {
      viewState: 'LOADING_VIEW_STATE',
      eventState: -1 // pending
    }
    return this.eventService.listenEventState(EventTypePrefix.BASIC, eventId)
      .pipe(
        takeUntil(this.destroy$),
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
          this.cdr.detectChanges()
        }),
        catchError(error => {
          console.error('Failed while listenEventState in list item:', error);
         
          return throwError(() => this._buildErrorState(error)) 

          // return EMPTY;
        })
      )
  }
  private _listenEventProps(eventId: number): Observable<EventProps> {
    return this.eventService.waitForEventProps(eventId).pipe(
      takeUntil(this.destroy$),
      tap(eventProps => {
        this.eventProps = eventProps;
        dd('Event props loaded:', eventProps);
      }),
      catchError(error => {
        dd(`Failed to load event props: ${error}`);
        return EMPTY;
      })
    );
  }
  
  ngOnDestroy() {
    dd('timer wrapper destroyed')
    this.destroy$.next();
    this.destroy$.complete();
  }

  private _buildErrorState(error: Error): EventViewState<EventState> {
    const errorState: EventViewState<EventState> = {
      viewState: 'ERROR_VIEW_STATE',
      eventState: EventStates.ERROR,
      error: error.message
    };

    return errorState;
  }

  ngOnChanges(changes: SimpleChanges): void {
    // dd('ngOnChanges triggered in ChildComponent');
    // if (changes['message']) {
    // }

    // dd(changes)
  }
  

  playEvent(isGuiEvent = true): void {
    this.eventService.playEvent(this.eventProps.id, isGuiEvent)
  }


  pauseEvent() {
    this.eventService.pauseEvent(this.eventProps.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe()
  }

  endEvent() {
    this.eventService.finishEventRunHooks(this.eventProps.id)
      .pipe(
        takeUntil(this.destroy$),
      )
      .subscribe()
  }
}
