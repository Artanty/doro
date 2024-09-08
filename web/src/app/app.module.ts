import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BehaviorSubject } from 'rxjs';
import { EVENT_BUS, IAuthDto, PRODUCT_NAME } from 'typlib';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DoroModule } from './doro/doro.module';

export const authProps: IAuthDto = {
  productName: 'DORO',
  authStrategy: 'backend',
  payload: {
    checkBackendUrl: 'https://cs99850.tmweb.ru/login',
    signInByDataUrl: 'https://cs99850.tmweb.ru/login',
    signInByTokenUrl: 'https://cs99850.tmweb.ru/loginByToken',
  },
  from: 'product',
  status: 'init',
};

const authEventBus$ = new BehaviorSubject(authProps);

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
    { provide: PRODUCT_NAME, useValue: 'DORO' },
    { provide: EVENT_BUS, useValue: authEventBus$ },
  ],
  bootstrap: [AppComponent],
  schemas: [],
})
export class AppModule {}
