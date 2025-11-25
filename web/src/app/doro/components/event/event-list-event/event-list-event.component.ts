import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { Observable, Subject, takeUntil, filter, startWith, distinctUntilChanged, map, tap, withLatestFrom } from 'rxjs';
import { EventWithState } from '../event.model';
import { EventData, EventService } from '../event.service';
import { CommonModule } from '@angular/common';
import { GuiDirective } from '../../_remote/web-component-wrapper/gui.directive';
import { dd } from 'src/app/doro/helpers/dd';

@Component({
  selector: 'app-event-list-event',
  standalone: true,
  imports: [GuiDirective, CommonModule],
  templateUrl: './event-list-event.component.html',
  styleUrl: './event-list-event.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventListEventComponent implements OnInit, OnDestroy, OnChanges {
  @Input() event!: EventWithState;
  // @Output() play = new EventEmitter<number>();
  @Output() actionAway = new EventEmitter<[string, any]>();
  @Output() deleteEventAway = new EventEmitter<[number, Event]>();
  
  // public eventState = 0; // 0=inactive, 1=active, 2=paused
  // public eventData$: any = null;
  menuItems = [
    { id: 'DELETE', name: 'Удалить' },
  ];
  connectionState$!: Observable<string>;
  eventData$!: Observable<EventData>;
  private destroy$ = new Subject<void>();
  
  constructor(
    private cdr: ChangeDetectorRef,
    private eventService: EventService
  ) {}
  
  ngOnInit() {
    const connId = 'doro';
    const connectionState$ = this.eventService.listenConnectionState(connId).pipe(
      takeUntil(this.destroy$),
      distinctUntilChanged()
    );
    this.eventData$ = this.eventService.listenEventState(this.event.eventId)
      .pipe(
        withLatestFrom(connectionState$),
        takeUntil(this.destroy$),
        tap((res: any) => {
          this.cdr.detectChanges()
        }),
        map((res: [EventData, string]) => {
          console.log(res)
          return res[0]
        })
      );


    // this.listenConnectionState()
    // this.listenEventState()
    // dd('ngOnInit triggered in ChildComponent');
    // dd(this.event.state)
    // this.eventState = this.event.state;
    
    if (this.event.state === 1) {
      this.playEvent(false);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // dd('ngOnChanges triggered in ChildComponent');
    // if (changes['message']) {

    // }

    // dd(changes)
  }
  
  playEvent(isGuiEvent = true): void {
    this.eventService.playEvent(this.event.eventId, isGuiEvent)
  }

  pauseEvent() {
    this.eventService.pauseEvent(this.event.eventId).subscribe(res => {
      dd(res)
      // const { state } = res;
      // this.eventState = state
      
      this.cdr.detectChanges()
    })
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  deleteEvent(eventId: number, event: Event) {
    this.deleteEventAway.emit([eventId, event])  
  }
}

// EventListEventComponent
// по иниту - делаем запрос на собственный бэк event-state/list-by-user
// получаем список ивентов
// рисуем список, каждый элемент - EventListEventComponent
// внутри каджого решаем, если событие активное - подписываемся.