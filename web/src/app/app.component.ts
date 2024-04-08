import { HttpClient } from '@angular/common/http';
import { Component, Inject } from '@angular/core';
import { StoreService } from './doro/services/store.service';
import {SERVER_URL} from "../../env";
import { TTab } from './doro/models/app.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'counter';

  constructor(
    @Inject(HttpClient) private http: HttpClient,
    @Inject(StoreService) private StoreServ: StoreService
  ){}

  test(testCase: number, event: MouseEvent) {
    this.http.get(`${SERVER_URL}/test?case=` + testCase)
    .subscribe((res: any) => {
      const clickedButton = event.target as HTMLButtonElement;
      const innerHTML = clickedButton.innerHTML;
      let result = res
      if (res.currentConfig) {
        result = res.currentConfig.scheduleEvent_id
      }
      console.log("TEST CASE:", innerHTML, "->");
      console.log(result)
    })
  }

  test2 (testCase: TTab) {
    this.StoreServ.setViewState(testCase)
  }

  rem () {
    // this.StoreServ.setScheduleEvents([1,3,4])
  }

  custom() {
this.http.post(`${SERVER_URL}/getScheduleConfig`, null)
      .subscribe((res: any) => {
        //
      })
  }

}
