import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Injector, Input, SimpleChanges } from '@angular/core';
import { Subject, Observable, takeUntil, map, startWith, tap, catchError, EMPTY, finalize, throwError } from 'rxjs';
import { EventStates } from 'src/app/doro/constants';
import { dd } from 'src/app/doro/helpers/dd';
import { EventStateResItemStateless } from '../event-list-event/event-list-event.component';
import { EventProps, EventViewState, EventState } from '../event.model';
import { EventStateResItem, EventService } from '../event.service';
import { ActivatedRoute } from '@angular/router';

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
    private route: ActivatedRoute
  ) {
    // const service = this.injector.get(IconFallbackService);
    // console.log(service)
  }

  // todo make pipe
  getPrc(eventState: any): number {
    const result = (eventState?.data?.cur && eventState?.data?.len)
      ? ((eventState?.data?.cur / eventState?.data?.len) * 100)
      : 0;
    return Math.round(result)
  }

  ngOnInit() {
    let initalState: EventViewState<EventStateResItemStateless> | EventViewState<EventState> = {
      viewState: 'LOADING_VIEW_STATE',
      eventState: -1 // pending
    }

    const eventProps = this.route.snapshot.data['event'];
    dd('eventProps')
    dd(eventProps)
    if (eventProps) {
      this.eventProps = eventProps;
    }

    if (!this.eventProps?.id) {
      initalState = this._buildErrorState(new Error('no event id'));
    }
    this.eventState$ = 
      this.eventService.listenEventState(this.eventProps?.id)
        .pipe(
          takeUntil(this.destroy$),
          map((res: EventStateResItem) => {
            const { stt, ...rest } = res;
            const readyState: EventViewState<EventStateResItemStateless> = {
              viewState: 'READY_VIEW_STATE',
              eventState: stt,
              data: rest
            };

            return readyState;
          }),
          startWith(initalState),
          tap((res: any) => {
            dd('go')
            dd(res)
            this.cdr.detectChanges()
          }),
          catchError(error => {
            console.error('Failed while listenEventState in list item:', error);
         
            return throwError(() => this._buildErrorState(error)) 

            // return EMPTY;
          })
        )
    // .subscribe(res => {
    //   this.eventState = res
    // })
  }
  
  ngOnDestroy() {
    dd('list item destroyed')
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

  deleteEvent() {
    // this.isDeleting$.next(true);
    // this.cdr.detectChanges()
    this.eventService.deleteEvent(this.eventProps.id);
  }
  deleteEvent2() {
    // this.eventState.eventState = EventStates.PENDING


    this.eventService.deleteEvent2(this.eventProps.id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          // this.isDeleting = false;
          // this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          console.log('delete success');
          // this.cdr.detectChanges();
        },
        error: (err) => console.error('Error deleting keyword:', err)
      });
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
    // .subscribe(res => {
    //   dd(res)
    //   // const { state } = res;
    //   // this.eventState = state
      
    //   this.cdr.detectChanges()
    // })
  }
}
