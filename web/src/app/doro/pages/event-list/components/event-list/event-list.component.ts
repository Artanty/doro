import { ChangeDetectorRef, Component, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Observable, tap, combineLatest, map, take, filter } from 'rxjs';
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
 
  menuItems = [
    { id: 'DELETE', name: 'Удалить' },
  ];
  // onItemSelect(user: any, selectedAction: any) {
  //   // this.itemActionAway.emit({ user, selectedAction: selectedAction.id })
  // }
  scheduleMenuItems$: Observable<Schedule[]>;

  ngOnInit() {
    this.eventService.loadRecentEventOrSchedule().subscribe();
  }

  constructor(
    private eventService: EventService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private _appStateService: AppStateService,
    private _scheduleService: ScheduleService
  ) {
    this.events$ = this.eventService.listenEvents()
      .pipe(
        map(res => res.filter(filterBasicEvents)),
        tap(res => {
          setTimeout(() => {
            this.cdr.detectChanges()
          }, 1000); // crutch to update state
        })
      );
    this.currentSchedule$ = this._appStateService.currentSchedule.listen as Observable<Nullable<Schedule>>;

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
    const scheduleId = data.id
    this._scheduleService.getScheduleWithEvents(scheduleId).subscribe(res => {
      if (res === true) {
        this._appStateService.currentSchedule.next(data);
      }
    })
  }

  public goToCreateEvent() {
    const scheduleId = this._appStateService.currentSchedule.value?.id;
    const extras = scheduleId ?
      { queryParams: { scheduleId: scheduleId } } :
      undefined;
    this.router.navigate(
      ['doro/create-event'], 
      extras
    );
  }

  public loadAllEvents(): void {
    this.eventService.loadEvents().pipe(take(1)).subscribe(() => {
      this._appStateService.currentSchedule.next(null);
    });
  }

  // public goToKeywordEdit(id: number) {
  //   this.router.navigateByUrl('/note/keyword-edit' + '/' + id)
  // }
}