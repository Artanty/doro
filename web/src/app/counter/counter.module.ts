import {
  NgModule,
  CUSTOM_ELEMENTS_SCHEMA,
  Injector,
  ApplicationRef,
  DoBootstrap,
  APP_INITIALIZER
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CounterComponent } from './counter.component';
import {BrowserModule} from "@angular/platform-browser";
import {RouterModule} from "@angular/router";
import {HttpClientModule} from "@angular/common/http";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {AppModule} from "../app.module";
import { createCustomElement } from '@angular/elements';
import { MyCustomElementComponent } from './../my-custom-element/my-custom-element.component';
import {AppComponent} from "../app.component";
import {AudioComponent} from "../audio/audio.component";
import {EventListComponent} from "./event-list/event-list.component";
import {CounterService} from "../services/counter.service";
import { BrowserAnimationsModule, provideAnimations } from '@angular/platform-browser/animations'; // Import BrowserAnimationsModule

function initAppFactory (bcStore: CounterService) {
  return () => bcStore.scheduleConfigActivator()
}

@NgModule({
    declarations: [
        CounterComponent,
        MyCustomElementComponent,
        EventListComponent
    ],
  imports: [
    CommonModule,
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    RouterModule.forChild([
      {
        path: '',
        component: CounterComponent
      }
    ]),
    ReactiveFormsModule,
    FormsModule,
    AudioComponent,
    // AppModule
  ],
    exports: [
        CounterComponent,
        MyCustomElementComponent,

    ],
    providers: [
      { provide: APP_INITIALIZER, useFactory: initAppFactory, deps: [CounterService], multi: true },
      provideAnimations(),
    ],
    schemas: [ CUSTOM_ELEMENTS_SCHEMA ],
})
export class CounterModule implements DoBootstrap {
    constructor(private injector: Injector) {}

    ngDoBootstrap(appRef: ApplicationRef) {
        const customElement = createCustomElement(MyCustomElementComponent, { injector: this.injector });
        customElements.define('my-custom-element', customElement);
        appRef.bootstrap(CounterComponent)
    }
}
