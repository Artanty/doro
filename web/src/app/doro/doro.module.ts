import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import {
  APP_INITIALIZER,
  ApplicationRef,
  CUSTOM_ELEMENTS_SCHEMA,
  DoBootstrap,
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
import { EventListComponent } from './widgets/event-list/event-list.component';

function initConfigActivator(counterServ: CounterService) {
  return () => counterServ.scheduleConfigActivator();
}

function initEventSource(sseServ: SseService) {
  return () => sseServ.createEventSource();
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
    LoadingComponent,
    FormArrayComponent,
    EndEventScreenComponent,
    ScrollDirective,
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
        component: DoroComponent,
      },
    ]),
    HttpClientModule,
  ],
  exports: [DoroComponent, MyCustomElementComponent, LoadingComponent],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: initConfigActivator,
      deps: [CounterService],
      multi: true,
    },
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class DoroModule implements DoBootstrap {
  constructor(private injector: Injector) {
    console.log('DoroModule');
  }
  ngDoBootstrap(appRef: ApplicationRef) {
    console.log('DoroModule ngDoBootstrap');
    const customElement = createCustomElement(MyCustomElementComponent, {
      injector: this.injector,
    });
    customElements.define('my-custom-element', customElement);
    appRef.bootstrap(CounterComponent);
  }
}
