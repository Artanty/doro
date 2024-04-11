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
import {ScrollDirective} from "./directives/scroll.directive";
import {FormArrayComponent} from "./components/form-array/form-array.component";
import {EndEventScreenComponent} from "./components/end-event-screen/end-event-screen.component";
import { EVENT_BUS } from 'typlib';
import { BehaviorSubject } from 'rxjs';
import { authProps } from '../app.component';

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
    LoadingComponent,
    FormArrayComponent,
    EndEventScreenComponent
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
        ScrollDirective,

        // HttpClientModule
    ],
  exports: [
    DoroComponent,
    MyCustomElementComponent,
    LoadingComponent
  ],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: initConfigActivator,
      deps: [CounterService],
      multi: true
    },
    // { provide: EVENT_BUS, useValue: new BehaviorSubject(authProps) },
    // { provide: 'PRODUCT_NAME', useValue: 'doro' }
    { provide: 'COMPONENT_TO_PASS', useClass: LoadingComponent },
    {
      provide: 'components',
      useValue: {
        LoadingComponent
      },
      multi: true,
    },
  ],
  schemas: [ CUSTOM_ELEMENTS_SCHEMA ],
})
export class DoroModule implements DoBootstrap {
  constructor(private injector: Injector) {}
  ngDoBootstrap(appRef: ApplicationRef) {
    const customElement = createCustomElement(MyCustomElementComponent, { injector: this.injector });
    customElements.define('my-custom-element', customElement);
    appRef.bootstrap(CounterComponent)
  }
}
