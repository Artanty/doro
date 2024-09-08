import { loadRemoteModule } from '@angular-architects/module-federation';
import { animate, style, transition, trigger } from '@angular/animations';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  InjectionToken,
  Injector,
  OnInit,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { BehaviorSubject, combineLatestWith, map, Observable, tap } from 'rxjs';
import { EVENT_BUS, IAuthDto, PRODUCT_NAME } from 'typlib';
import { LoadingComponent } from './components/loading/loading.component';
import { TConnectionState, TTab } from './models/app.model';
import { SseService } from './services/sse.service';
import { StoreService } from './services/store.service';

export const EVENT_BUS_LISTENER = new InjectionToken<Observable<any>>('');
export const EVENT_BUS_PUSHER = new InjectionToken<(authDto: IAuthDto) => void>(
  ''
);

@Component({
  selector: 'app-doro',
  templateUrl: './doro.component.html',
  styleUrl: './doro.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('animationTriggerName', [
      transition(':enter', [
        style({ transform: 'translateX(-100%)', opacity: 0 }),
        animate(
          '300ms ease',
          style({ transform: 'translateX(0)', opacity: 1 })
        ),
      ]),
      transition(':leave', [
        style({ opacity: 1 }),
        animate('0.3s', style({ opacity: 0 })),
      ]),
    ]),
  ],
  providers: [
    {
      provide: EVENT_BUS_LISTENER,
      useFactory: (eventBus$: BehaviorSubject<IAuthDto>) => {
        return eventBus$
          .asObservable()
          .pipe
          // filter((res) => res.from === 'product')
          ();
      },
      deps: [EVENT_BUS],
    },
    {
      provide: EVENT_BUS_PUSHER,
      useFactory: (eventBus$: BehaviorSubject<IAuthDto>) => {
        return (authDto: IAuthDto) => {
          eventBus$.next(authDto);
        };
      },
      deps: [EVENT_BUS],
    },
  ],
})
export class DoroComponent implements OnInit {
  public connectionState$: Observable<TConnectionState>;
  public viewState$: Observable<TTab | null>;
  connectionState: TConnectionState = 'LOADING';
  @ViewChild('placeHolder', { read: ViewContainerRef })
  viewContainer!: ViewContainerRef;
  authEventBus$!: BehaviorSubject<IAuthDto>;
  isEventSourceCreated: boolean = false;

  constructor(
    @Inject(StoreService) private StoreServ: StoreService,
    @Inject(SseService) private SseServ: SseService,
    @Inject(ChangeDetectorRef) private cdr: ChangeDetectorRef,
    private injector: Injector,
    @Inject(EVENT_BUS_LISTENER)
    private readonly eventBusListener$: Observable<IAuthDto>
  ) {
    this.eventBusListener$.subscribe((res) => {
      console.log('DORO BUS');
      console.log(res);
      if (res.status === 'ACCESS_GRANTED') {
        this.createEventSourceOnce();
      }
    });

    this.connectionState$ = this.StoreServ.listenConnectionState().pipe(
      tap((res: any) => {
        if (res === 'AUTH') {
          this.loadAuthComponent();
        }
        this.connectionState = res;
        this.cdr.detectChanges();
      })
    );
    this.viewState$ = this.StoreServ.listenConnectionState().pipe(
      combineLatestWith(this.StoreServ.listenViewState()),
      map(([connection, view]) => {
        this.cdr.detectChanges();
        return connection === 'READY' ? view : null;
      })
    );
  }

  ngOnInit(): void {
    const inj = this.injector.get<any>(PRODUCT_NAME);
    console.log('DoroComponent gets PRODUCT_NAME: ');
    console.log(inj);
  }

  createEventSourceOnce() {
    if (!this.isEventSourceCreated) {
      this.SseServ.createEventSource();
      this.isEventSourceCreated = true;
    }
  }

  reconnect() {
    this.SseServ.createEventSource();
  }

  async loadAuthComponent(): Promise<void> {
    const m = await loadRemoteModule({
      remoteName: 'au',
      // remoteEntry: 'https://au2.vercel.app/remoteEntry.js',
      remoteEntry: 'http://localhost:4204/remoteEntry.js',
      // remoteEntry: './assets/mfe/doro/assets/mfe/au/remoteEntry.js',
      exposedModule: './Component',
    });

    this.viewContainer.createComponent(m.AuthComponent, {
      injector: Injector.create({
        providers: [
          /**
           * Вытащить отсюда этот компонент
           * и положить на уровень host'а
           */
          {
            provide: 'components',
            useValue: {
              LoadingComponent,
            },
            multi: true,
          },
        ],
      }),
    });
  }
}
