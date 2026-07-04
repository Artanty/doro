import { CommonModule } from '@angular/common';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA, Inject } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BehaviorSubject, Observable, filter, map, switchMap, tap } from 'rxjs';
import { EVENT_BUS_LISTENER, BusEvent, EVENT_BUS, EVENT_BUS_PUSHER } from 'typlib';
import { GuiDirective } from './components/_remote/web-component-wrapper/gui.directive';
import { DoroComponent } from './doro.component';
import { AccessLevelService } from './services/access-level.service';
import { EventService } from './services/basic-event/basic-event.service';
import { ApiService } from './services/common-api/common-api.service';
import { CompareConfigHashAction } from './services/core/compare-config-hash.action';
import { SetConfigHashAction } from './services/core/set-config-hash.action';
import { StorageService } from './services/core/storage.service';

import { ScheduleService } from './services/schedule/schedule.service';
import { SettingsService } from './services/settings/settings.service';
import { TransitionEventService } from './services/transition-event/transition-event.service';
import { filterStreamDataEntries } from './helpers/filterStreamDataEntries';
import { mapBusEventToConfigHashTikEntry } from './helpers/getConfigHashFromBusEvent';
import { thisProjectResProp } from './helpers/getResProp';
import { dd } from '@helpers/dd';
import { AppStateService } from '@services/core/app-state.service';

export const CHILD_ROUTES = [
  {
    path: '', 
    component: DoroComponent,
    children: [
      {
        path: 'event-list', 
        loadChildren: () => import('./pages/event-list/event-list.module')
          .then(m => m.EventListModule)
      },
      {
        path: 'create-event', 
        loadChildren: () => import('./pages/create-event/create-event.module')
          .then(m => m.CreateEventModule)
      },
      {
        path: 'create-schedule', 
        loadChildren: () => import('./pages/create-schedule/create-schedule.module')
          .then(m => m.CreateScheduleModule)
      },
      {
        path: 'schedule-list', 
        loadChildren: () => import('./pages/schedule-list/schedule-list.module')
          .then(m => m.ScheduleListModule)
      },
      {
        path: 'settings', 
        loadChildren: () => import('./pages/settings/settings.module')
          .then(m => m.SettingsModule)
      },
      {
        path: 'schedule-run', 
        loadChildren: () => import('./pages/schedule-run/schedule-run.module')
          .then(m => m.ScheduleRunModule)
      },
    ]
  },
]

@NgModule({
  declarations: [
    DoroComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule.forChild(CHILD_ROUTES),
    GuiDirective
  ],
  exports: [DoroComponent],
  providers: [
    {
      provide: EVENT_BUS_LISTENER,
      useFactory: (eventBus$: BehaviorSubject<BusEvent>) => {
        return eventBus$
          .asObservable()
          .pipe(filter((res) => res.to === thisProjectResProp()));
      },
      deps: [EVENT_BUS],
    },
    {
      provide: EVENT_BUS_PUSHER,
      useFactory: (eventBus$: BehaviorSubject<BusEvent>) => {
        return (busEvent: BusEvent) => {
          eventBus$.next(busEvent);
        };
      },
      deps: [EVENT_BUS]
    },
    EventService,
    TransitionEventService,
    AccessLevelService,
    
    ScheduleService,
    ApiService,
    StorageService,
    SettingsService,
    CompareConfigHashAction,
    SetConfigHashAction
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class DoroModule {
  constructor(
    @Inject(EVENT_BUS_LISTENER) private eventBusListener$: Observable<BusEvent>,
    @Inject(EVENT_BUS_PUSHER) private eventBusPusher: (busEvent: BusEvent) => void,
    private _compareConfigHashAction: CompareConfigHashAction,
    private _setConfigHashAction: SetConfigHashAction,
    private eventService: EventService,
    private _scheduleService: ScheduleService,
    private _state: AppStateService,
  ) {
    this.eventBusListener$
      .pipe(
        filter((res) => res.to === `${process.env['PROJECT_ID']}@${process.env['NAMESPACE']}`),
        filter((res) => res.event === 'SET_CONFIG_HASH'),
      )
      .subscribe((res: BusEvent) => {
        this._setConfigHashAction.init(res);
      });
    // listen events changes
    this.eventBusListener$.pipe(
      filter(filterStreamDataEntries),
      map(busEvent => mapBusEventToConfigHashTikEntry(busEvent, 'events')),
      filter(Boolean),
      map((configHashTikEntry): boolean => {
        const isNeedRefresh = this._compareConfigHashAction.init(configHashTikEntry);
        return isNeedRefresh;
      }),
      filter(Boolean),
      tap(() => {
        console.log('EVENTS HASH not equal. refresh...');
        this._state.events.refresh()
      })
    )
      .subscribe();

    // listen schedule changes
    this.eventBusListener$.pipe(
      filter(filterStreamDataEntries),
      map(busEvent => mapBusEventToConfigHashTikEntry(busEvent, 'schedules')),
      filter(Boolean),
      map((configHashTikEntry): boolean => {
        const isNeedRefresh = this._compareConfigHashAction.init(configHashTikEntry);
        return isNeedRefresh;
      }),
      filter(Boolean),
      tap(() => {
        console.log('SCHEDULES HASH not equal. refresh...');
        this._scheduleService.refreshSchedules(); // todo make separate hashes from events and schedules?
      })
    )
      .subscribe();
  }
}