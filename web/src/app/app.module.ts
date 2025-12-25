import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { HTTP_INTERCEPTORS, HttpClientModule, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BehaviorSubject } from 'rxjs';
import { BusEvent, EVENT_BUS, HOST_NAME } from 'typlib';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DoroModule } from './doro/doro.module';
import { MockInterceptor } from './app.mock.interceptor';

import { initializeIconFallback } from './app.icon-fallback.observer';
import { MockBackService } from './app.mock.back.service';



// export const authStrategyBusEvent: BusEvent = {
//   from: 'DORO',
//   to: 'AU',
//   event: 'authStrategy',
//   payload: {
//     authStrategy: 'backend',
//     checkBackendUrl: 'http://localhost:3600/check',
//     signInByDataUrl: 'http://localhost:3600/login',
//     signInByTokenUrl: 'http://localhost:3600/loginByToken',
//     status: 'init',
//   },
// };

export const initBusEvent: BusEvent = {
  event: "INIT",
  from: `${process.env['PROJECT_ID']}@${process.env['NAMESPACE']}`,
  to: "",
  payload: {}
}

// const eventBus$ = new BehaviorSubject(authStrategyBusEvent);
const eventBus$ = new BehaviorSubject(initBusEvent)

@NgModule({
  declarations: [
    AppComponent,
    // GlobalIconFallbackDirective
  ],
  imports: [
    // CommonModule,
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    DoroModule,
    HttpClientModule,
    // GlobalIconFallbackDirective,
    // SharedModule
  ],
  /**
   * Эти провайдеры для standalone сборки приложения DORO
   * при mfe сборке будут работать провайдеры host'а.
   */
  providers: [
    { provide: EVENT_BUS, useValue: eventBus$ },
    { provide: HOST_NAME, useValue: 'DORO' },
    provideHttpClient(
      // DI-based interceptors must be explicitly enabled.
      withInterceptorsFromDi(),
    ),
    { provide: HTTP_INTERCEPTORS, useClass: MockInterceptor, multi: true },
    // {
    //   provide: APP_INITIALIZER,
    //   useFactory: (loader: DirectiveLoaderService) => () => {
    //     // Register root directives
    //     loader.registerRootDirectives([IconFallbackDirectiveService]);
    //     return Promise.resolve();
    //   },
    //   deps: [DirectiveLoaderService],
    //   multi: true
    // },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeIconFallback,
      multi: true
    }
  ],
  bootstrap: [AppComponent],
  schemas: [],

})
export class AppModule {
  constructor(
    private _mockBackService: MockBackService
  ) {
    this._mockBackService.init()
  }
}
