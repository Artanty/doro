import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Injector, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { Observable, Subject, takeUntil, filter, startWith, distinctUntilChanged, map, tap, withLatestFrom, catchError, EMPTY, finalize } from 'rxjs';
import { EventProps, EventState, EventStateResItem, EventStateResItemStateless, EventViewState, EventWithState } from '../event.model';
import { EventService, } from '../event.service';
import { CommonModule } from '@angular/common';
import { GuiDirective } from '../../_remote/web-component-wrapper/gui.directive';
import { dd } from 'src/app/doro/helpers/dd';
import { EventStates } from 'src/app/doro/constants';
import { Router } from '@angular/router';



@Component({
  selector: 'app-event-list-event',
  standalone: false,
  // standalone: true,
  // imports: [GuiDirective, CommonModule,
  //   // GlobalIconFallbackDirective
  // ],
  templateUrl: './event-list-event.component.html',
  styleUrl: './event-list-event.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventListEventComponent implements OnInit, OnDestroy {
  @Input() eventProps!: EventProps;
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
    private router: Router,
  ) {
    // const service = this.injector.get(IconFallbackService);
    // console.log(service)
  }
  
  // loading view state
  // play loading
  // play
  // pause loading
  // pause
  // stop loading
  // stop
  // delete loading
  // delete
  // completed
  // completed loading
  // error
  // data


  /**
   * Подписываемся на свойства события из (doro@web),
   * и одновременно ожидаем состояние события из (tik@web)
   * EventWithState = { eventProps, eventState }
   * */
  ngOnInit() {
    const initalState: EventViewState<EventStateResItemStateless> = {
      viewState: 'LOADING_VIEW_STATE',
      eventState: -1 // pending
    }
    this.eventState$ = 
      this.eventService.listenEventState(this.eventProps.id)
        .pipe(
          takeUntil(this.destroy$),
          map((res: EventStateResItem) => {
            dd(res)
            const { stt, ...rest } = res;
            const readyState: EventViewState<EventStateResItemStateless> = {
              viewState: 'READY_VIEW_STATE',
              eventState: stt,
              data: { ...rest, prc: 0 }
            };

            return readyState;
          }),
          startWith(initalState),
          tap((res: any) => {
            this.cdr.detectChanges()
          }),
          catchError(error => {
            console.error('Failed while listenEventState in list item:', error);
          
            const errorState: EventViewState<EventState> = {
              viewState: 'READY_VIEW_STATE',
              eventState: EventStates.ERROR,
              error: error.message
            };

            return EMPTY;
          })
        )
    // .subscribe(res => {
    //   this.eventState = res
    // })
  }

  goToEventTimer() {
    this.router.navigateByUrl(`/doro/timer/${this.eventProps.id}`);
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

  ngOnDestroy() {
    dd('list item destroyed')
    this.destroy$.next();
    this.destroy$.complete();
  }

  
}

// EventListEventComponent
// по иниту - делаем запрос на собственный бэк event-state/list-by-user
// получаем список ивентов
// рисуем список, каждый элемент - EventListEventComponent
// внутри каджого решаем, если событие активное - подписываемся.