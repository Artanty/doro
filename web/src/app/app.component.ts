import { HttpClient } from '@angular/common/http';
import { Component, Inject, ViewChild, ViewContainerRef } from '@angular/core';
import { TTab } from './doro/models/app.model';
import { StoreService } from './doro/services/store.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  @ViewChild('placeHolder', { read: ViewContainerRef })
  viewContainer!: ViewContainerRef;

  constructor(
    @Inject(HttpClient) private http: HttpClient,
    @Inject(StoreService) private StoreServ: StoreService
  ) {}

  async load(): Promise<void> {
    //
  }

  test(testCase: number, event: MouseEvent) {
    this.http
      .get(`${process.env['SERVER_URL']}/test?case=` + testCase)
      .subscribe((res: any) => {
        const clickedButton = event.target as HTMLButtonElement;
        const innerHTML = clickedButton.innerHTML;
        let result = res;
        if (res.currentConfig) {
          result = res.currentConfig.scheduleEvent_id;
        }
        console.log('TEST CASE:', innerHTML, '->');
        console.log(result);
      });
  }

  test2(testCase: TTab) {
    this.StoreServ.setViewState(testCase);
  }

  rem() {
    //
  }

  custom() {
    console.log(`${process.env['SERVER_URL']}`);
  }
}
