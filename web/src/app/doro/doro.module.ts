import { CommonModule } from '@angular/common';
import { HTTP_INTERCEPTORS, HttpClient, HttpClientModule, provideHttpClient, withInterceptors, withInterceptorsFromDi } from '@angular/common/http';
import {
  APP_INITIALIZER,
  ApplicationRef,
  CUSTOM_ELEMENTS_SCHEMA,
  DoBootstrap,
  Inject,
  Injector,
  NgModule,
} from '@angular/core';
import { createCustomElement } from '@angular/elements';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { EventService } from './services/event.service';
import { RouterModule } from '@angular/router';
import { BehaviorSubject, Observable, filter, map, switchMap, of } from 'rxjs';
import { EVENT_BUS_LISTENER, BusEvent, EVENT_BUS, EVENT_BUS_PUSHER } from 'typlib';
import { GuiDirective } from './components/_remote/web-component-wrapper/gui.directive';
import { DoroComponent } from './doro.component';
import { dd } from './helpers/dd';
import { filterStreamDataEntries } from './helpers/filterStreamDataEntries';
import { mapBusEventToConfigHashTikEntry, ConfigHashTikEntry } from './helpers/getConfigHashFromBusEvent';
import { TimerWrapperComponent } from './pages/timer/components/timer-wrapper/timer-wrapper.component';

import { AccessLevelService } from './services/access-level.service';
import { CompareConfigHashAction } from './services/compare-config-hash.action';
import { EventTypeService } from './services/event-type.service';

import { ScheduleService } from './services/schedule.service';
import { SetConfigHashAction } from './services/set-config-hash.action';
import { NextEventService } from './services/next-event.service';
import { ApiService } from './services/api.service';
import { RouterService } from './services/router.service';
import { StorageService } from './services/storage.service';
import { SettingsService } from './services/settings.service';

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
        path: 'timer', 
        loadChildren: () => import('./pages/timer/timer.module')
          .then(m => m.TimerModule)
      },
      {
        path: 'next-event', 
        loadChildren: () => import('./pages/next-event/next-event.module')
          .then(m => m.NextEventModule)
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
    
    RouterModule.forChild(
      CHILD_ROUTES
    ),
    GuiDirective
    
  ],
  exports: [DoroComponent],
  providers: [
    {
      provide: EVENT_BUS_LISTENER,
      useFactory: (eventBus$: BehaviorSubject<BusEvent>) => {
        return eventBus$
          .asObservable()
        // .pipe(filter((res) => res.to === process.env['APP']));
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
      deps: [EVENT_BUS],
    },
    EventService,
    NextEventService,
    AccessLevelService,
    EventTypeService,
    ScheduleService,
    ApiService,
    RouterService,
    StorageService,
    SettingsService
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class DoroModule implements DoBootstrap {
  constructor(
    private injector: Injector,
    @Inject(EVENT_BUS_LISTENER)
    private readonly eventBusListener$: Observable<BusEvent>,
    @Inject(EVENT_BUS_PUSHER)
    private readonly eventBusPusher: (busEvent: BusEvent) => void,
    private _compareConfigHashAction: CompareConfigHashAction,
    private _setConfigHashAction: SetConfigHashAction,
    private eventService: EventService,
  ) {
    console.log('doro module constructor');
    // this.eventBusListener$.subscribe((res: BusEvent) => {
    //   console.log('DORO BUS LISTENER');
    // });
 
    // part of scenario
    // При получении ответа с doro@back сохраняется configHash.
    this.eventBusListener$
      .pipe(
        filter((res) => res.to === `${process.env['PROJECT_ID']}@${process.env['NAMESPACE']}`),
        filter((res) => res.event === 'SET_CONFIG_HASH'),
      )
      .subscribe((res: BusEvent) => {
        this._setConfigHashAction.init(res);
      });

    // При получении состояния таймеров из tik@web сравниваем с configHash:
    this.eventBusListener$.pipe(
      filter(filterStreamDataEntries),
      map(busEvent => mapBusEventToConfigHashTikEntry(busEvent)),
      filter(Boolean),
      map((configHashTikEntry: ConfigHashTikEntry): boolean => {
        const isNeedRefresh = this._compareConfigHashAction.init(configHashTikEntry);
        return isNeedRefresh;
      }),
      filter(Boolean),
      switchMap(() => {
        dd('configHash not equal. refresh...')
        return this.eventService.loadEvents();
      })
    )
      .subscribe();
    // part of scenario END
    
  }
  ngDoBootstrap(appRef: ApplicationRef) {
    // // console.log('DoroModule ngDoBootstrap');
    // const customElement = createCustomElement(MyCustomElementComponent, {
    //   injector: this.injector,
    // });
    // customElements.define('my-custom-element', customElement);
    // appRef.bootstrap(CounterComponent);
  }

  private _sendAuthDoneEvent(): void { 
    const doneBusEvent: BusEvent = {
      from: `${process.env['PROJECT_ID']}@${process.env['NAMESPACE']}`,
      to: `${process.env['PROJECT_ID']}@${process.env['NAMESPACE']}`,
      event: `ACCESS_GRANTED`,
      payload: {},
      status: `ACCESS_GRANTED`,
    }
    this.eventBusPusher(doneBusEvent)
  }
}
