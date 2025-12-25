import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Optional, Inject, OnInit } from "@angular/core";
import { StoreService } from "./services/store.service";
import { combineLatestWith, map, Observable, tap } from "rxjs";
import { TConnectionState, TTab } from "./models/app.model";
import { SseService } from "./services/sse.service";
import { BusEvent, EVENT_BUS_LISTENER, HOST_NAME } from "typlib";
import { animate, style, transition, trigger } from "@angular/animations";
import { Router } from "@angular/router";

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
})
export class DoroComponent implements OnInit {
  public connectionState$!: Observable<TConnectionState>;
  public viewState$!: Observable<TTab | null>;
  connectionState: TConnectionState = 'LOADING';
  // @ViewChild('placeHolder', { read: ViewContainerRef })
  // viewContainer!: ViewContainerRef;
  // eventBus$!: BehaviorSubject<BusEvent>;
  isEventSourceCreated: boolean = false;

  constructor(
    @Inject(StoreService) private StoreServ: StoreService,
    @Inject(SseService) private SseServ: SseService,
    @Inject(ChangeDetectorRef) private cdr: ChangeDetectorRef,
    // private injector: Injector,
    @Inject(EVENT_BUS_LISTENER)
    private readonly eventBusListener$: Observable<BusEvent>,
    // @Inject(EVENT_BUS_PUSHER)
    // private readonly eventBusPusher: (busEvent: BusEvent) => void,
    private router: Router,
    @Optional() @Inject(HOST_NAME) private hostName?: string,
  ) {
   
    
    // this.connectionState$ = this.StoreServ.listenConnectionState().pipe(
    //   tap((res: any) => {
    //     console.log(res)
    //     if (res === 'AUTH') {
    //       // this.loadAuthComponent();
    //     }
    //     this.connectionState = res;
    //     this.cdr.detectChanges();
    //   })
    // );
    // this.viewState$ = this.StoreServ.listenConnectionState().pipe(
    //   combineLatestWith(this.StoreServ.listenViewState()),
    //   map(([connection, view]) => {
    //     console.log('this.viewState$')
    //     console.log(connection)
    //     console.log(view)
    //     this.cdr.detectChanges();
    //     return connection === 'READY' ? view : null;
    //   })
    // );
  }

  ngOnInit(): void {
    // this.createEventSourceOnce();
    if (this.hostName === 'DORO-STANDALONE') {
      this.router.navigateByUrl('/doro/timer/209')  
    } else {
      this.router.navigateByUrl('/doro/event-list')
    }
    

  }

  createEventSourceOnce() {
    if (!this.isEventSourceCreated) {
      this.SseServ.createEventSource();
      this.isEventSourceCreated = true;
    }
  }

  reconnect() {
    // this.SseServ.createEventSource();
  }

  // async loadAuthComponent(): Promise<void> {
  //   const m = await loadRemoteModule({
  //     remoteName: 'au',
  //     // remoteEntry: 'https://au2.vercel.app/remoteEntry.js',
  //     remoteEntry: 'http://localhost:4204/remoteEntry.js',
  //     // remoteEntry: './assets/mfe/doro/assets/mfe/au/remoteEntry.js',
  //     exposedModule: './Component',
  //   });

  //   this.viewContainer.createComponent(m.AuthComponent, {
  //     injector: Injector.create({
  //       providers: [
  //         /**
  //          * Вытащить отсюда этот компонент
  //          * и положить на уровень host'а
  //          */
  //         {
  //           provide: 'components',
  //           useValue: {
  //             LoadingComponent,
  //           },
  //           multi: true,
  //         },
  //       ],
  //     }),
  //   });
  // }
  // private _sendAuthDoneEvent(): void {
  //   const doneBusEvent: BusEvent = {
  //     from: `${process.env['PROJECT_ID']}@${process.env['NAMESPACE']}`,
  //     to: `${process.env['PROJECT_ID']}@${process.env['NAMESPACE']}`,
  //     event: `ACCESS_GRANTED`,
  //     payload: {},
  //     status: `ACCESS_GRANTED`,
  //   }
  //   this.eventBusPusher(doneBusEvent)
  // }
}
