import { HttpClientModule } from "@angular/common/http"
import { NgModule } from "@angular/core"
import { ReactiveFormsModule } from "@angular/forms"
import { BrowserModule } from "@angular/platform-browser"
import { BrowserAnimationsModule } from "@angular/platform-browser/animations"
import { BehaviorSubject } from "rxjs"
import { EVENT_BUS, IAuthDto, PRODUCT_NAME } from "typlib"
import { AppRoutingModule } from "./app-routing.module"
import { AppComponent } from "./app.component"

export const authProps: IAuthDto = {
  productName: "CHRM",
  authStrategy: "backend",
  payload: {
    checkBackendUrl: "http://localhost:3600/check",
    signInByDataUrl: "http://localhost:3600/login",
    signInByTokenUrl: "http://localhost:3600/loginByToken",
  },
  from: "product",
  status: "init",
}

const authEventBus$ = new BehaviorSubject(authProps)

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
    { provide: EVENT_BUS, useValue: authEventBus$ },
    { provide: PRODUCT_NAME, useValue: "CHRM" },
    {
      provide: "components",
      useValue: {},
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
