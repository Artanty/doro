import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Injector, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { Observable, Subject, takeUntil, filter, startWith, distinctUntilChanged, map, tap, withLatestFrom, catchError, EMPTY, finalize } from 'rxjs';

import { EventService, } from '../event.service';
import { CommonModule } from '@angular/common';
import { GuiDirective } from '../../_remote/web-component-wrapper/gui.directive';
import { dd } from 'src/app/doro/helpers/dd';
import { EventStates } from 'src/app/doro/constants';
import { Router } from '@angular/router';
import { Schedule, ScheduleService } from '../schedule.service';
import { EventProps, EventViewState, EventStateResItem, EventStateResItemStateless, EventState } from '../event.types';

@Component({
  selector: 'app-event-list-event',
  standalone: false,
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
  scheduleMenuItems$: Observable<Schedule[]>;
  
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
    private _scheduleService: ScheduleService
  ) {
    this.scheduleMenuItems$ = this._scheduleService.getSchedules().pipe(
      map(res => {
        if (this.eventProps.schedule_id) {
          return res.filter(el => el.id !== this.eventProps.schedule_id);
        }
        return res;
      }));
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
            // dd(res)
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
  }

  goToEventTimer() {
    this.router.navigateByUrl(`/doro/timer/${this.eventProps.id}`);
  }
  deleteEvent() {
    this.eventService.deleteEvent(this.eventProps.id);
  }
  addToSchedule(data: any) {
    const scheduleId = data.id;
    this.eventService.addToSchedule(this.eventProps.id, scheduleId).subscribe()
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
    this.destroy$.next();
    this.destroy$.complete();
  }

  
}

// EventListEventComponent
// по иниту - делаем запрос на собственный бэк event-state/list-by-user
// получаем список ивентов
// рисуем список, каждый элемент - EventListEventComponent
// внутри каджого решаем, если событие активное - подписываемся.