import { Component, OnInit, ChangeDetectorRef } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { Observable, BehaviorSubject, combineLatest, map, tap, take } from "rxjs";
import { filterBasicEvents } from "@helpers/filterBasicEvents";
import { Nullable } from "@helpers/utility.types";
import { EventService } from "@services/basic-event/basic-event.service";
import { Schedule } from "@services/basic-event/basic-event.types";
import { AppStateService } from "@services/core/app-state.service";
import { ScheduleService } from "@services/schedule/schedule.service";
import { GetEventResDataItem } from "@contracts/event.contract";

@Component({
  selector: 'app-event-list',
  standalone: false,
  templateUrl: './event-list.component.html',
  styleUrl: './event-list.component.scss'
})
export class EventListComponent implements OnInit {
  public events$: Observable<GetEventResDataItem[]>;
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
    this.route.paramMap.subscribe(params => {
      const scheduleId = params.get('id');
      
      if (scheduleId) {
        this.switchToSchedule({ data: scheduleId })
      }
    });
  }

  constructor(
    private eventService: EventService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private _state: AppStateService,
    private _scheduleService: ScheduleService,
    private route: ActivatedRoute
  ) {
    this.events$ = combineLatest([
      this._state.events.listen(),
      this.scheduleFilter$
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
}