import { HttpClientModule } from "@angular/common/http"
import { NgModule } from "@angular/core"
import { ReactiveFormsModule } from "@angular/forms"
import { BrowserModule } from "@angular/platform-browser"
import { BrowserAnimationsModule } from "@angular/platform-browser/animations"
import { BehaviorSubject } from "rxjs"
import { BusEvent, EVENT_BUS, HOST_NAME } from "typlib"
import { AppRoutingModule } from "./app-routing.module"
import { AppComponent } from "./app.component"

export const authStrategyBusEvent: BusEvent = {
  from: "CHRM",
  to: "AU",
  event: "authStrategy",
  payload: {
    authStrategy: "backend",
    checkBackendUrl: "http://localhost:3600/check",
    signInByDataUrl: "http://localhost:3600/login",
    signInByTokenUrl: "http://localhost:3600/loginByToken",
    status: "init",
  },
}

const eventBus$ = new BehaviorSubject(authStrategyBusEvent)

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    HttpClientModule,
  ],
  providers: [
    { provide: EVENT_BUS, useValue: eventBus$ },
    { provide: HOST_NAME, useValue: "CHRM" },
    {
      provide: "components",
      useValue: {},
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}

// checkBackendUrl: 'https://cs99850.tmweb.ru/login',
// signInByDataUrl: 'https://cs99850.tmweb.ru/login',
// signInByTokenUrl: 'https://cs99850.tmweb.ru/loginByToken',
// },
// from: 'product',
// status: 'init',
