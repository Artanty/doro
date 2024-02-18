import { HttpClient } from '@angular/common/http';
import { Component, Inject } from '@angular/core';
import { StoreService } from './doro/services/store.service';
import {SERVER_URL} from "../../env";

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

  test(testCase: number) {
    this.http.get(`${SERVER_URL}/test?case=` + testCase)
      .subscribe((res: any) => {
        console.log(res)
      })
  }

  rem () {
    // this.StoreServ.setScheduleEvents([1,3,4])
  }

}
