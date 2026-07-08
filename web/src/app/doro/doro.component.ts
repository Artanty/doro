import { trigger, transition, style, animate } from "@angular/animations";
import { Component, ChangeDetectionStrategy, OnInit, Inject, ChangeDetectorRef, Optional, DestroyRef } from "@angular/core";
import { Router } from "@angular/router";
import { Observable, filter, map, tap } from "rxjs";
import { EVENT_BUS_LISTENER, BusEvent, HOST_NAME } from "typlib";
import { dd } from "./helpers/dd";
import { filterStreamDataEntries } from "./helpers/filterStreamDataEntries";
import { findActiveTikTransitionEvent, findActiveTikBasicEvent } from "./helpers/tik-events";
import { EventService } from "./services/basic-event/basic-event.service";
import { AppStateService } from "./services/core/app-state.service";
import { SettingsService } from "./services/settings/settings.service";
import { TransitionEventService } from "./services/transition-event/transition-event.service";
import { mapBusEventToConfigHashTikEntry } from "@helpers/getConfigHashFromBusEvent";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ApiService } from "@services/common-api/common-api.service";
import { ResponseLogEntry } from "./components/log-viewer/log-viewer.component";

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
  public isError = false;
  public logs: ResponseLogEntry[] = [];
  public currentLogIndex = 0;

  get logData(): ResponseLogEntry | null {
    return this.logs[this.currentLogIndex] ?? null;
  }
  constructor(
    @Inject(ChangeDetectorRef) private cdr: ChangeDetectorRef,
    // private injector: Injector,
    @Inject(EVENT_BUS_LISTENER)
    private readonly eventBusListener$: Observable<BusEvent>,
    // @Inject(EVENT_BUS_PUSHER)
    // private readonly eventBusPusher: (busEvent: BusEvent) => void,
    private router: Router,
    private readonly _eventService: EventService,
    private readonly _nextEventService: TransitionEventService,
    private _state: AppStateService,
    private _settings: SettingsService,
    private destroyRef: DestroyRef,
    private _apiService: ApiService,
    @Optional() @Inject(HOST_NAME) private hostName?: string,
  ) {}

  ngOnInit(): void {
    // if (this.hostName === 'DORO-STANDALONE') {
    //   // this.router.navigateByUrl('/doro/timer/209');
    //   this.router.navigateByUrl('/doro/create-schedule');
      
    // } else {
    //   // this.router.navigateByUrl('/doro/schedule-create');
    //   this.router.navigateByUrl('/doro/event-list')
    //   // this.router.navigateByUrl('/doro/event-create')
    // }
    this.listenEvents();
  }

  /**
   * listen to runnng transition events
   * */
  listenEvents() {
    this.eventBusListener$.pipe(
      takeUntilDestroyed(this.destroyRef),
      filter(filterStreamDataEntries),
    ).subscribe(res => {
      if (this._settings.isSheevaMode() === false) {
        const foundActiveTransition = findActiveTikTransitionEvent(res.payload);
        const foundActiveBasicEvent = findActiveTikBasicEvent(res.payload);

        if (foundActiveTransition) {
          dd('foundActiveTransition')
          dd(foundActiveTransition)
        } 
        else if (foundActiveBasicEvent) {
          dd('foundActiveBasicEvent')
          dd(foundActiveBasicEvent)
        }
      }
    });

    // listen tik errors
    this.eventBusListener$.pipe(
      takeUntilDestroyed(this.destroyRef),
      filter(filterStreamDataEntries),
      map(busEvent => mapBusEventToConfigHashTikEntry(busEvent, 'tikErrors')),
      filter(Boolean),
      tap(() => {
        this.isError = true;
        this.cdr.markForCheck();
      })
    )
      .subscribe();
  }

  requestError() {
    this._apiService.getTikLogsApi()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          this.logs = Array.isArray(res) ? res : (res.logs || [res]);
          this.currentLogIndex = 0;
          this.cdr.markForCheck();
        },
        error: () => {
          this.logs = [];
          this.cdr.markForCheck();
        }
      });
  }

  prevLog() {
    if (this.currentLogIndex > 0) {
      this.currentLogIndex--;
      this.cdr.markForCheck();
    }
  }

  nextLog() {
    if (this.currentLogIndex < this.logs.length - 1) {
      this.currentLogIndex++;
      this.cdr.markForCheck();
    }
  }

  closeLogModal() {
    this.logs = [];
  }
}

export const fromTikId = (tikId: string): number => {
  return Number(tikId.split('_')[1]);
}

