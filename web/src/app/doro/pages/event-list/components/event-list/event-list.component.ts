import { ChangeDetectorRef, Component, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Observable, tap, combineLatest, map, take, filter, Subject, BehaviorSubject } from 'rxjs';
import { AppStateService } from 'src/app/doro/services/app-state.service';
import { Schedule, ScheduleService } from 'src/app/doro/services/schedule.service';
import { EventService } from 'src/app/doro/services/event.service';
import { EventProps } from 'src/app/doro/services/event.types';
import { Nullable } from 'src/app/doro/helpers/utility.types';
import { filterBasicEvents } from 'src/app/doro/helpers/filterBasicEvents';
import { dd } from 'src/app/doro/helpers/dd';

@Component({
  selector: 'app-event-list',
  standalone: false,
  templateUrl: './event-list.component.html',
  styleUrl: './event-list.component.scss'
})
export class EventListComponent implements OnInit {
  public events$: Observable<EventProps[]>;
  public currentSchedule$: Observable<Nullable<Schedule>>;
  scheduleFilter$ = new BehaviorSubject<Nullable<number>>(null);

  menuItems = [
    { id: 'DELETE', name: 'Удалить' },
  ];
  // onItemSelect(user: any, selectedAction: any) {
  //   // this.itemActionAway.emit({ user, selectedAction: selectedAction.id })
  // }
  scheduleMenuItems$: Observable<Schedule[]>;
  /**
   * грузим всё что есть за сутки,
   * если встречается транзишн-ивент - роутимся на его страницу.
   * 
   * */
  ngOnInit() {
    // this.eventService.loadEvents().subscribe();
  }

  constructor(
    private eventService: EventService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private _state: AppStateService,
    private _scheduleService: ScheduleService
  ) {
    this.events$ = combineLatest([
      this._state.events.listen(),
      this.scheduleFilter$ // Your second observable for schedule filtering
    ])
      .pipe(
        map(([events, scheduleFilter]) => {
          let filteredEvents = events.filter(filterBasicEvents);
        
          if (scheduleFilter) {
            filteredEvents = filteredEvents.filter(e => e.schedule_id === scheduleFilter);
          }
        
          return filteredEvents;
        }),
        tap(res => {
          setTimeout(() => {
            this.cdr.detectChanges()
            dd(this._state.events.getValue())
          }, 1000); // crutch to update state
        })
      );

    this.currentSchedule$ = this._state.currentSchedule.listen() as Observable<Nullable<Schedule>>;

    this.scheduleMenuItems$ = combineLatest([
      this._scheduleService.getSchedules(),
      this.currentSchedule$  
    ]).pipe(
      map(([
        allSchedules, 
        currentSchedule
      ]) => {
        if (!currentSchedule) {
          return allSchedules;
        }
        return allSchedules.filter(schedule => 
          schedule.id !== currentSchedule.id
        );
      })
    )
  }

  public switchToSchedule(data: any) {
    const scheduleId = Number(data.id)
    this.scheduleFilter$.next(scheduleId);
  }

  public goToCreateEvent() {
    const scheduleId = this._state.currentSchedule.getValue()?.id;
    const extras = scheduleId ?
      { queryParams: { scheduleId: scheduleId } } :
      undefined;
    this.router.navigate(
      ['doro/create-event'], 
      extras
    );
  }

  public loadEvents(daysInterval: number = 1): void {
    this.eventService.loadEvents(daysInterval).pipe(take(1)).subscribe(() => {
      this._state.currentSchedule.next(null);
    });
  }
}