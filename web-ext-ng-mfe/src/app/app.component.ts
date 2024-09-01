import { loadRemoteModule } from '@angular-architects/module-federation';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import {
  Component,
  Injector,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { EVENT_BUS, IAuthDto, PRODUCT_NAME } from 'typlib';

export const authProps: IAuthDto = {
  productName: 'doro',
  authStrategy: 'backend',
  payload: {
    checkBackendUrl: 'https://cs99850.tmweb.ru/login',
    signInByDataUrl: 'https://cs99850.tmweb.ru/login',
    signInByTokenUrl: 'https://cs99850.tmweb.ru/loginByToken',
  },
  from: 'product',
  status: 'init',
};

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HttpClientModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'web-ext-ng-mfe';
  authEventBus$!: BehaviorSubject<IAuthDto>;

  @ViewChild('placeHolder', { read: ViewContainerRef })
  viewContainer!: ViewContainerRef;

  constructor() {
    this.loadAuthComponent();
    this.authEventBus$ = new BehaviorSubject(authProps);
  }
  async loadAuthComponent(): Promise<void> {
    const m = await loadRemoteModule({
      remoteName: 'au',
      remoteEntry: './assets/remoteEntry.js',
      exposedModule: './Component',
    });

    this.viewContainer.createComponent(m.AuthComponent, {
      injector: Injector.create({
        providers: [
          { provide: EVENT_BUS, useValue: this.authEventBus$ },
          { provide: PRODUCT_NAME, useValue: 'doro' },
        ],
      }),
    });
  }
}
