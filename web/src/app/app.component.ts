import { HttpClient } from '@angular/common/http';
import { Component, Inject, ComponentFactoryResolver, ComponentRef, InjectionToken, Injector, ViewChild, ViewContainerRef } from '@angular/core';
import { StoreService } from './doro/services/store.service';
import {SERVER_URL} from "../../env";
import { TTab } from './doro/models/app.model';
import { loadRemoteModule } from '@angular-architects/module-federation';
import { BehaviorSubject } from 'rxjs';
// export const MY_CUSTOM_TOKEN = new InjectionToken<string>('MyCustomToken');
import { EVENT_BUS, PRODUCT_NAME, IAuthDto } from 'typlib'
import { LoadingComponent } from './doro/components/loading/loading.component';

export const authProps: IAuthDto = {
  productName: 'doro',
  authStrategy: 'backend',
  payload: {
    checkBackendUrl: 'https://cs99850.tmweb.ru/login',
    signInByDataUrl: 'https://cs99850.tmweb.ru/login',
    signInByTokenUrl: 'https://cs99850.tmweb.ru/loginByToken'
  },
  from: 'product',
  status: 'init'
};


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  @ViewChild('placeHolder', { read: ViewContainerRef })
   viewContainer!: ViewContainerRef;

  // bs!: BehaviorSubject<IAuthDto>
  loadingComponent: any

  constructor(
    @Inject(HttpClient) private http: HttpClient,
    @Inject(StoreService) private StoreServ: StoreService,
  ){

    // this.bs = new BehaviorSubject(authProps)
    // this.bs.asObservable().subscribe(res  => {
    //   // console.log(res)
    // })
  }

  async load(): Promise<void> {

    // const m = await loadRemoteModule({
    //   remoteName: 'au',
    //   remoteEntry: 'http://localhost:4204/remoteEntry.js',
    //   exposedModule: './Component'
    // });

    // this.viewContainer.createComponent(
    //   m.AuthComponent,
    //   {
    //     injector: Injector.create({
    //       providers: [
    //         { provide: EVENT_BUS, useValue: this.bs },
    //         { provide: PRODUCT_NAME, useValue: 'doro' },
    //       ],
    //     }),
    //   }
    // );
  }

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
    // this.bs.next({...authProps, status: 'new'})
this.http.post(`https://cs99850.tmweb.ru/test`, { data: 'qwe' })
      .subscribe((res: any) => {
        console.log(res)
      })
  }

}
