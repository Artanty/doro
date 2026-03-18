import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Optional, Inject, OnInit } from "@angular/core";
import { combineLatestWith, filter, map, Observable, tap } from "rxjs";
import { BusEvent, EVENT_BUS_LISTENER, HOST_NAME } from "typlib";
import { animate, style, transition, trigger } from "@angular/animations";
import { Router } from "@angular/router";
import { EventService } from "./services/event.service";
import { filterActiveTransitionEvents, filterTransitionEvents } from "./helpers/filterTransitionEvents";
import { dd } from "./helpers/dd";
import { NextEventService } from "./services/next-event.service";
import { AppStateService } from "./services/app-state.service";
import { filterActiveBasicEvents } from "./helpers/filterBasicEvents";
import { filterStreamDataEntries } from "./helpers/filterStreamDataEntries";
import { findActiveTikBasicEvent, findActiveTikTransitionEvent } from "./helpers/tik-events";
import { RouterService } from "./services/router.service";


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
  constructor(
    @Inject(ChangeDetectorRef) private cdr: ChangeDetectorRef,
    // private injector: Injector,
    @Inject(EVENT_BUS_LISTENER)
    private readonly eventBusListener$: Observable<BusEvent>,
    // @Inject(EVENT_BUS_PUSHER)
    // private readonly eventBusPusher: (busEvent: BusEvent) => void,
    private router: Router,
    private _routerService: RouterService,
    private readonly _eventService: EventService,
    private readonly _nextEventService: NextEventService,
    private _state: AppStateService,
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

    // this._state.events.listen().pipe(
    //   map(res => res.filter(filterActiveTransitionEvents)),
    //   filter(res => res && res.length > 0)
    // ).subscribe(res => {
    //   this._nextEventService.onTransitionFound(res)
    // })

    // this._state.events.listen().pipe(
    //   filter(res => res && res.length > 0)
    // ).subscribe(res => {
    //   const activeTransitionEvents = res.filter(filterActiveTransitionEvents);
    //   const activeBasicEvents = res.filter(filterActiveBasicEvents);
    //   dd('activeTransitionEvents')
    //   dd(activeTransitionEvents)
    //   dd('activeBasicEvents')
    //   dd(activeBasicEvents)
    //   if (activeTransitionEvents.length > 0) {
    //     dd('branch 1')
    //     this._nextEventService.onTransitionFound(res)  
    //   } else if (activeBasicEvents.length > 0) {
    //     dd('branch 2')
    //     // this.router.navigateByUrl(`/doro/timer/${activeBasicEvents[0].id}`);
    //   }
    // })
    this.listenEvents();
  }

  /**
   * listen to runnng transition events
   * */
  listenEvents() {
    this.eventBusListener$.pipe(
      filter(filterStreamDataEntries),
    ).subscribe(res => {
      // dd(res)
      const foundActiveTransition = findActiveTikTransitionEvent(res.payload);
      if (foundActiveTransition) {
        // dd(foundActiveTransition)
        const transitionId = fromTikId(foundActiveTransition.id);
        // dd(transitionId)
        this._nextEventService.onTransitionFound(transitionId);
      }
      const foundActiveBasicEvent = findActiveTikBasicEvent(res.payload);
      if (foundActiveBasicEvent) {
        dd('foundActiveBasicEvent')
        dd(foundActiveBasicEvent)
        const basicEventId = fromTikId(foundActiveBasicEvent.id);
        dd(basicEventId);
        this._routerService.go(`/doro/timer/${basicEventId}`);
      }
    })
  }
}

export const fromTikId = (tikId: string): number => {
  return Number(tikId.split('_')[1]);
}

