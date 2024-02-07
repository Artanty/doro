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
import { CounterService } from '../doro/services/counter.service';
import { EventListComponent} from '../doro/widgets/event-list/event-list.component'
import { NavigationComponent } from './components/navigation/navigation.component';

function initAppFactory (bcStore: CounterService) {
  return () => bcStore.scheduleConfigActivator()
}

@NgModule({
  declarations: [
    DoroComponent,
    CounterComponent,
    MyCustomElementComponent,
    EventListComponent,
    NavigationComponent
  ],
  imports: [
    CommonModule,
    BrowserModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    FormsModule,
    AudioComponent,
  ],
  exports: [
    DoroComponent,
    MyCustomElementComponent,
  ],
  providers: [
    { provide: APP_INITIALIZER, useFactory: initAppFactory, deps: [CounterService], multi: true },
    provideAnimations(),
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
