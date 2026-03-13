import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Optional, Inject, OnInit } from "@angular/core";

import { combineLatestWith, filter, map, Observable, tap } from "rxjs";
import { BusEvent, EVENT_BUS_LISTENER, HOST_NAME } from "typlib";
import { animate, style, transition, trigger } from "@angular/animations";
import { Router } from "@angular/router";
import { EventService } from "./services/event.service";
import { filterTransitionEvents } from "./helpers/filterTransitionEvents";
import { dd } from "./helpers/dd";
import { NextEventService } from "./services/next-event.service";

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
    private readonly _eventService: EventService,
    private readonly _nextEventService: NextEventService,
    @Optional() @Inject(HOST_NAME) private hostName?: string,
  ) {}

  ngOnInit(): void {
    if (this.hostName === 'DORO-STANDALONE') {
      // this.router.navigateByUrl('/doro/timer/209');
      this.router.navigateByUrl('/doro/create-schedule');
      
    } else {
      // this.router.navigateByUrl('/doro/schedule-create');
      this.router.navigateByUrl('/doro/event-list')
      // this.router.navigateByUrl('/doro/event-create')
    }

    this._eventService.listenEvents().pipe(
      map(res => res.filter(filterTransitionEvents)),
      filter(res => res && res.length > 0)
    ).subscribe(res => {
      this._nextEventService.onTransitionFound(res)
    })
  }

  // private listenTransitionEvent() {
  //   this._eventService.listenEventState(EventTypePrefix.TRANSITION)
  // }
}
