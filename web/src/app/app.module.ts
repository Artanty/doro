import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BehaviorSubject } from 'rxjs';
import { BusEvent, EVENT_BUS, HOST_NAME } from 'typlib';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DoroModule } from './doro/doro.module';

export const authStrategyBusEvent: BusEvent = {
  from: 'DORO',
  to: 'AU',
  event: 'authStrategy',
  payload: {
    authStrategy: 'backend',
    checkBackendUrl: 'http://localhost:3600/check',
    signInByDataUrl: 'http://localhost:3600/login',
    signInByTokenUrl: 'http://localhost:3600/loginByToken',
    status: 'init',
  },
};

const eventBus$ = new BehaviorSubject(authStrategyBusEvent);

@NgModule({
  declarations: [AppComponent],
  imports: [
    // CommonModule,
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    DoroModule,
    HttpClientModule,
  ],
  /**
   * Эти провайдеры для standalone сборки приложения DORO
   * при mfe сборке будут работать провайдеры host'а.
   */
  providers: [
    { provide: EVENT_BUS, useValue: eventBus$ },
    { provide: HOST_NAME, useValue: 'DORO' },
  ],
  bootstrap: [AppComponent],
  schemas: [],
})
export class AppModule {}
