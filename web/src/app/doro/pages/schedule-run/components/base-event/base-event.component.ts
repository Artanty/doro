import { Component, ChangeDetectionStrategy, Input } from "@angular/core";
import { Subject, takeUntil } from "rxjs";
import { EventStates } from "src/app/doro/constants";
import { countPrc } from "src/app/doro/helpers/count-percent.util";
import { dd } from "src/app/doro/helpers/dd";
import { EventService } from "src/app/doro/services/basic-event/basic-event.service";
import { EVENT_PROPS_KEY, EVENT_STATE_KEY, EventProps, EventPropsWithState, EventStateResItem } from "src/app/doro/services/basic-event/basic-event.types";

@Component({
  selector: 'app-base-event',
  standalone: false,
  templateUrl: './base-event.component.html',
  styleUrl: './base-event.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BaseEventComponent {
  @Input() public data!: EventPropsWithState;
  
  public get eventProps(): EventProps {
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
    this.eventService.playEvent(this.eventProps.id, isGuiEvent)
  }

  pauseEvent() {
    this.eventService.pauseEvent(this.eventProps.id)
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
