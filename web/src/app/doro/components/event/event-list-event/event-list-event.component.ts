import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { Observable, Subject, takeUntil, filter, startWith, distinctUntilChanged, map, tap, withLatestFrom, catchError, EMPTY } from 'rxjs';
import { EventProps, EventState, EventViewState, EventWithState } from '../event.model';
import { EventData, EventService, EventStateResItem } from '../event.service';
import { CommonModule } from '@angular/common';
import { GuiDirective } from '../../_remote/web-component-wrapper/gui.directive';
import { dd } from 'src/app/doro/helpers/dd';
import { EventStates } from 'src/app/doro/constants';

export type EventStateResItemStateless = Omit<EventStateResItem, 'stt'>
@Component({
  selector: 'app-event-list-event',
  standalone: true,
  imports: [GuiDirective, CommonModule],
  templateUrl: './event-list-event.component.html',
  styleUrl: './event-list-event.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventListEventComponent implements OnInit, OnDestroy, OnChanges {
  @Input() eventProps!: EventProps;
  // @Output() play = new EventEmitter<number>();
  @Output() actionAway = new EventEmitter<[string, any]>();
  @Output() deleteEventAway = new EventEmitter<[number, Event]>();
  
  // public eventState = 0; // 0=inactive, 1=active, 2=paused
  // public eventData$: any = null;
  menuItems = [
    { id: 'DELETE', name: 'Удалить' },
  ];
  connectionState$!: Observable<string>;
  eventState$!: Observable<EventViewState<EventStateResItem>>;
  public EventStates = EventStates
  private destroy$ = new Subject<void>();
  
  constructor(
    private cdr: ChangeDetectorRef,
    private eventService: EventService
  ) {}
  
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
    this.eventState$ = this.eventService.listenEventState(this.eventProps.id)
      .pipe(
        
        tap((res: any) => {
          // dd(res);
          this.cdr.detectChanges()
        }),
        // withLatestFrom(connectionState$),
        takeUntil(this.destroy$),
        
        // map((res: [EventData, string]) => {
        //   console.log(res)
        //   return res[0]
        // })
        // 0=inactive, 1=active, 2=paused, etc.
        map((res: EventStateResItem) => {
          // export interface EventStateResItem {
          //   id: string,
          //   cur: number,
          //   len: number,
          //   prc: number,
          //   stt: number
          // }

          const { stt, ...rest } = res;
          const readyState: EventViewState<EventStateResItemStateless> = {
            viewState: 'READY_VIEW_STATE',
            eventState: stt,
            data: rest
          };

          return readyState;
          // const result: EventData = {
          //   data: {
          //     formattedTime: '12:34'
          //   },
          //   state: 'isRunning',
          //   initialEvent: this.event
          // }
          // console.log(result)
          // return result;
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
          // return throwError(() => new Error(`Failed to play event ${eventId}: ${error.message}`));
        })
      );


    // this.listenConnectionState()
    // this.listenEventState()
    // dd('ngOnInit triggered in ChildComponent');
    
    // this.eventState = this.event.state;
    
    // if (this.event.state === 1) {
    //   this.playEvent(false);
    // }
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
    // this.eventService.pauseEvent(this.event.eventId).subscribe(res => {
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

  deleteEvent() {
    this.eventService.deleteEvent(this.eventProps.id)
      .subscribe({
        next: () => console.log('delete success'),
        error: (err) => console.error('Error deleting keyword:', err)
      });
  }
}

// EventListEventComponent
// по иниту - делаем запрос на собственный бэк event-state/list-by-user
// получаем список ивентов
// рисуем список, каждый элемент - EventListEventComponent
// внутри каджого решаем, если событие активное - подписываемся.