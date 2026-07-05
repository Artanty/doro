import { Component, ChangeDetectionStrategy, Input } from "@angular/core";
import { EventService } from "@services/basic-event/basic-event.service";
import { Subject, takeUntil } from "rxjs";


import { EventStates } from "../../../../constants";
import { countPrc } from "@helpers/count-percent.util";
import { dd } from "../../../../helpers/dd";
import { EventPropsWithState, EventProps, EVENT_PROPS_KEY, EventStateResItem, EVENT_STATE_KEY } from "@services/basic-event/basic-event.types";
import { GetEventResDataItem } from "@contracts/event.contract";

@Component({
  selector: 'app-base-event',
  standalone: false,
  templateUrl: './base-event.component.html',
  styleUrl: './base-event.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BaseEventComponent {
  @Input() public data!: EventPropsWithState;
  
  public get eventProps(): GetEventResDataItem {
    return this.data[EVENT_PROPS_KEY];
  }
  
  public get eventState(): EventStateResItem & { prc?: number } {
    let stateWithPrc: EventStateResItem & { prc?: number } = this.data[EVENT_STATE_KEY];
    stateWithPrc.prc = countPrc(stateWithPrc.len!, stateWithPrc.cur);
    
    return stateWithPrc;
  }

  public EventStates = EventStates;

  private destroy$ = new Subject<void>();
  
  constructor(
    private eventService: EventService,
  ) {}
  
  ngOnDestroy() {
    dd('base event component destroyed')
    this.destroy$.next();
    this.destroy$.complete();
  }

  playEvent(isGuiEvent = true): void {
    this.eventService.playEvent(
      this.eventProps.id, 
      this.eventProps.schedule_id
    ).subscribe()
  }

  pauseEvent() {
    this.eventService.pauseEvent(this.eventProps.id, this.eventProps.schedule_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe()
  }

  endEvent() {
    this.eventService.finishEventRunHooks(this.eventProps.id)
      .pipe(
        takeUntil(this.destroy$),
      )
      .subscribe()
  }
}
