import { HttpClientModule } from "@angular/common/http"
import { NgModule } from "@angular/core"
import { ReactiveFormsModule } from "@angular/forms"
import { BrowserModule } from "@angular/platform-browser"
import { BrowserAnimationsModule } from "@angular/platform-browser/animations"
import { BehaviorSubject } from "rxjs"
import { EVENT_BUS, PRODUCT_NAME } from "typlib"
import { AppRoutingModule } from "./app-routing.module"
import { AppComponent } from "./app.component"

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
    { provide: EVENT_BUS, useValue: new BehaviorSubject("") },
    { provide: PRODUCT_NAME, useValue: "au" },
    {
      provide: "components",
      useValue: {},
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
