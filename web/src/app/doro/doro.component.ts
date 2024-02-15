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
  OnInit
} from '@angular/core';
import {
  combineLatestWith,
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
  constructor (
    @Inject(StoreService) private StoreServ: StoreService,
    @Inject(SseService) private SseServ: SseService,
    @Inject(ChangeDetectorRef) private cdr: ChangeDetectorRef,
  ) {
    this.connectionState$ = this.StoreServ.listenConnectionState().pipe(
      tap((res: any) => {
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
      })
    );
    this.SseServ.createEventSource()
  }

  ngOnInit (): void {

  }

  reconnect() {
    this.SseServ.createEventSource()
  }
}
