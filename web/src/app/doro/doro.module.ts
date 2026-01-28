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
import { RouterModule } from '@angular/router';
import { AudioComponent } from '../audio/audio.component';
import { MyCustomElementComponent } from '../my-custom-element/my-custom-element.component';
import { EndEventScreenComponent } from './components/end-event-screen/end-event-screen.component';
import { FormArrayComponent } from './components/form-array/form-array.component';
import { LoadingComponent } from './components/loading/loading.component';
import { NavigationComponent } from './components/navigation/navigation.component';
import { NoiseComponent } from './components/noise/noise.component';
import { ScrollDirective } from './directives/scroll.directive';
import { DoroComponent } from './doro.component';
import { CounterService } from './services/counter.service';
import { SseService } from './services/sse.service';
import { CounterConfigComponent } from './widgets/counter-config/counter-config.component';
import { CounterComponent } from './widgets/counter/counter.component';

import { BusEvent, EVENT_BUS, EVENT_BUS_LISTENER, EVENT_BUS_PUSHER } from 'typlib';
import { BehaviorSubject, filter, map, Observable, switchMap, take } from 'rxjs';
import { dd } from './helpers/dd';
import { EventListComponent } from './components/event/event-list/event-list.component';
import { EventService } from './components/event/event.service';

import { EventListEventComponent } from './components/event/event-list-event/event-list-event.component';
import { GuiDirective } from './components/_remote/web-component-wrapper/gui.directive';
import { TimerComponent } from './components/event/timer/timer.component';
import { TimerWrapperComponent } from './components/event/timer-wrapper/timer-wrapper.component';
import { eventResolver } from './components/event/timer-wrapper/event.resolver';
import { EventCreateComponent } from './components/event/event-create/event-create.component';
import { CompareConfigHashAction } from './services/compare-config-hash.action';
import { SetConfigHashAction } from './services/set-config-hash.action';
import { filterStreamDataEntries } from './helpers/filterStreamDataEntries';
import { EventStateResItem } from './components/event/event.model';


// function initConfigActivator(counterServ: CounterService) {
//   return () => counterServ.scheduleConfigActivator();
// }

// function initEventSource(sseServ: SseService) {
//   return () => sseServ.createEventSource();
// }

export const CHILD_ROUTES = [
  {
    path: '', 
    component: DoroComponent,
    children: [
      {
        path: 'event-list', component: EventListComponent
      },
      {
        path: 'event-create', component: EventCreateComponent
      },
      {
        path: 'timer/:id', 
        component: TimerWrapperComponent,
        resolve: {
          event: eventResolver
        }
      },
    ]
  },
]

@NgModule({
  declarations: [
    DoroComponent,
    CounterComponent,
    MyCustomElementComponent,
    // EventListComponent,
    // NavigationComponent,
    // CounterConfigComponent,
    // NoiseComponent,
    LoadingComponent,
    // FormArrayComponent,
    // EndEventScreenComponent,
    // ScrollDirective,
    EventListComponent,
    EventListEventComponent,
    TimerComponent,
    TimerWrapperComponent,
    EventCreateComponent
  ],
  imports: [
    CommonModule,
    // BrowserModule,
    // BrowserAnimationsModule,
    ReactiveFormsModule,
    FormsModule,
    AudioComponent,
    RouterModule.forChild(CHILD_ROUTES),
    // HttpClientModule,
    GuiDirective
    
  ],
  // exports: [DoroComponent, MyCustomElementComponent, LoadingComponent],
  exports: [DoroComponent],
  providers: [
    // provideHttpClient(
    //   // DI-based interceptors must be explicitly enabled.
    //   withInterceptorsFromDi(),
    // ),
    // {
    //   provide: APP_INITIALIZER,
    //   useFactory: initConfigActivator,
    //   deps: [CounterService],
    //   multi: true,
    // },
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
    EventService
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
    console.log('DoroModule');
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
        console.log(res);
        this._setConfigHashAction.init(res);
      });

    // При получении состояния таймеров из tik@web сравниваем с configHash:
    this.eventBusListener$.pipe(
      filter(filterStreamDataEntries),
      map((busEvent: BusEvent<EventStateResItem[]>): boolean => {
        const foundEntry = busEvent.payload.find(entry => entry.id === 'h_1');
        if (!foundEntry) {
          return false
        } else {
          const isNeedRefresh = !this._compareConfigHashAction.init(foundEntry);
          return isNeedRefresh;
        }
      }),
      filter(Boolean),
      switchMap(() => {
        dd('configHash not equal. make request...')
        return this.eventService.loadEvents();
      })
    )
      .subscribe();
    // part of scenario END
    
  }
  ngDoBootstrap(appRef: ApplicationRef) {
    // console.log('DoroModule ngDoBootstrap');
    const customElement = createCustomElement(MyCustomElementComponent, {
      injector: this.injector,
    });
    customElements.define('my-custom-element', customElement);
    appRef.bootstrap(CounterComponent);
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
