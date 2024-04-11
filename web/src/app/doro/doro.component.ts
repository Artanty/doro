import {
  animate,
  style,
  transition,
  trigger
} from '@angular/animations';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  Injector,
  OnInit,
  ViewChild,
  ViewContainerRef
} from '@angular/core';
import {
  BehaviorSubject,
  combineLatestWith,
  distinctUntilChanged,
  map,
  Observable,
  startWith,
  tap
} from 'rxjs';
import {StoreService} from './services/store.service';
import {SseService} from "./services/sse.service";
import {
  TConnectionState,
  TTab
} from "./models/app.model";
import { loadRemoteModule } from '@angular-architects/module-federation';
import { EVENT_BUS, PRODUCT_NAME, IAuthDto } from 'typlib'

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
  selector: 'app-doro',
  templateUrl: './doro.component.html',
  styleUrl: './doro.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('animationTriggerName', [
      transition(':enter', [
        style({ transform: 'translateX(-100%)', opacity: 0 }),
        animate('300ms ease', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        style({ opacity: 1 }),
        animate('0.3s', style({ opacity: 0 })),
      ]),
    ]),
    ]
})
export class DoroComponent implements OnInit{

  public connectionState$: Observable<TConnectionState>
  public viewState$: Observable<TTab | null>
  connectionState: TConnectionState = 'LOADING'

  @ViewChild('placeHolder', { read: ViewContainerRef })
  viewContainer!: ViewContainerRef;

  authEventBus$!: BehaviorSubject<IAuthDto>

  isEventSourceCreated: boolean = false


  constructor (
    @Inject(StoreService) private StoreServ: StoreService,
    @Inject(SseService) private SseServ: SseService,
    @Inject(ChangeDetectorRef) private cdr: ChangeDetectorRef,
  ) {
    this.authEventBus$ = new BehaviorSubject(authProps)
    this.authEventBus$.asObservable().subscribe(res  => {
      if (res.status === 'ACCESS_GRANTED') {
        this.createEventSourceOnce()
      }
    })

    this.connectionState$ = this.StoreServ.listenConnectionState().pipe(
      tap((res: any) => {
        if (res === 'AUTH') {
          this.loadAuthComponent()
        }
        this.connectionState = res
        this.cdr.detectChanges()
      })
    )
    this.viewState$ = this.StoreServ.listenConnectionState().pipe(
      combineLatestWith(this.StoreServ.listenViewState()),
      map(([connection, view])=> {
        this.cdr.detectChanges()
        return connection === 'READY'
        ? view
        : null
      }),
      tap(()=>{
        // this.cdr.detectChanges()
      })
    );
    // here was create event source
  }

  ngOnInit (): void {

  }

  createEventSourceOnce () {
    if (!this.isEventSourceCreated) {
      this.SseServ.createEventSource()
      this.isEventSourceCreated = true
    }
  }

  reconnect() {
    this.SseServ.createEventSource()
  }

  async loadAuthComponent(): Promise<void> {

    const m = await loadRemoteModule({
      remoteName: 'au',
      remoteEntry: 'https://au2.vercel.app/remoteEntry.js',
      // remoteEntry: 'http://localhost:4204/remoteEntry.js',
      exposedModule: './Component'
    });

    this.viewContainer.createComponent(
      m.AuthComponent,
      {
        injector: Injector.create({
          providers: [
            { provide: EVENT_BUS, useValue: this.authEventBus$ },
            { provide: PRODUCT_NAME, useValue: 'doro' },
          ],
        }),
      }
    );
  }

  test() {
    const authProps: IAuthDto = {
      productName: 'doro',
      authStrategy: 'backend',
      payload: {
        checkBackendUrl: 'https://1cs99850.tmweb.ru/login',
        signInByDataUrl: 'https://1cs99850.tmweb.ru/login',
        signInByTokenUrl: 'https://1cs99850.tmweb.ru/loginByToken'
      },
      from: 'product',
      status: 'test'
    };
    this.authEventBus$.next(authProps)
  }
  test1() {
    const authProps: IAuthDto = {
      productName: 'doro',
      authStrategy: 'backend',
      payload: {
        checkBackendUrl: 'https://1cs99850.tmweb.ru/login',
        signInByDataUrl: 'https://1cs99850.tmweb.ru/login',
        signInByTokenUrl: 'https://1cs99850.tmweb.ru/loginByToken'
      },
      from: 'product',
      status: 'test1'
    };
    this.authEventBus$.next(authProps)
  }
}
