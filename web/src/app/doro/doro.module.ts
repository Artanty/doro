import { APP_INITIALIZER, ApplicationRef, CUSTOM_ELEMENTS_SCHEMA, DoBootstrap, Injector, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DoroComponent } from './doro.component';
import { CounterComponent } from './widgets/counter/counter.component'
import { createCustomElement } from '@angular/elements';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule, provideAnimations } from '@angular/platform-browser/animations';
import { AudioComponent } from '../audio/audio.component';

import { MyCustomElementComponent } from '../my-custom-element/my-custom-element.component';
import { CounterService } from './services/counter.service';
import { EventListComponent} from './widgets/event-list/event-list.component'
import { NavigationComponent } from './components/navigation/navigation.component';
import { SseService } from './services/sse.service';
import {CounterConfigComponent} from "./widgets/counter-config/counter-config.component";
import {RouterModule} from "@angular/router";
import {HttpClientModule} from "@angular/common/http";
import {NoiseComponent} from "./components/noise/noise.component";
import {LoadingComponent} from "./components/loading/loading.component";

function initConfigActivator (counterServ: CounterService) {
  return () => counterServ.scheduleConfigActivator()
}

function initEventSource (sseServ: SseService) {
  return () => sseServ.createEventSource()
}

@NgModule({
  declarations: [
    DoroComponent,
    CounterComponent,
    MyCustomElementComponent,
    EventListComponent,
    NavigationComponent,
    CounterConfigComponent,
    NoiseComponent,
    LoadingComponent
  ],
  imports: [
    CommonModule,
    // BrowserModule,
    // BrowserAnimationsModule,
    ReactiveFormsModule,
    FormsModule,
    AudioComponent,
    RouterModule.forChild([
      {
        path: '',
        component: DoroComponent
      }
    ]),

    // HttpClientModule
  ],
  exports: [
    DoroComponent,
    MyCustomElementComponent,

  ],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: initConfigActivator,
      deps: [CounterService],
      multi: true
    },
    // {
    //   provide: APP_INITIALIZER,
    //   useFactory: initEventSource,
    //   deps: [SseService],
    //   multi: true
    // },
    // provideAnimations(),
  ],
  schemas: [ CUSTOM_ELEMENTS_SCHEMA ],
})
export class DoroModule implements DoBootstrap {
// export class DoroModule  {
  constructor(private injector: Injector) {}
  ngDoBootstrap(appRef: ApplicationRef) {
    const customElement = createCustomElement(MyCustomElementComponent, { injector: this.injector });
    customElements.define('my-custom-element', customElement);
    appRef.bootstrap(CounterComponent)
  }
}
