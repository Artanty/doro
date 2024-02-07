import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnChanges,
  OnInit
} from '@angular/core';
import {StoreService} from "../../services/store.service";
import {
  combineLatest,
  Observable,
  tap
} from "rxjs";
import {AsyncPipe} from "@angular/common";
import {
  differenceInMinutes,
  format
} from "date-fns";
import {HttpClient} from "@angular/common/http";
import { CounterService } from 'src/app/services/counter.service';

interface ScheduleEvent {
  createdAt: string;
  eventType: string;
  id: number;
  name: string;
  schedule_id: number;
  timeFrom: string;
  timeTo: string;
  updatedAt: string;
  isPlaying?: boolean
}


@Component({
  selector: 'app-event-list',
  templateUrl: './event-list.component.html',
  styleUrl: './event-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventListComponent implements OnInit, AfterViewInit, OnChanges{

  loading: boolean = true
  state: boolean = false
  scheduleEvents: ScheduleEvent[] = []

  get isPaused() {
    return this.state
  }
  constructor (
    @Inject(StoreService) public Store: StoreService,
    private cdr: ChangeDetectorRef,
    private http: HttpClient,
    @Inject(CounterService) private CounterServ: CounterService
  ) {}

  play () {
    this.state = false
    console.log(this.state)
    this.cdr.detectChanges()
  }
  pause () {
    this.state = true
    console.log(this.state)
    this.cdr.detectChanges()
  }
  tracker(index:number, item:any):any{
    // console.log(item)
    return item.id;
  }

  ngOnInit() {
    combineLatest([this.Store.listenScheduleEvents(), this.Store.listenScheduleConfig()])
      .subscribe(([scheduleEvents, scheduleConfig]: [any[], any]) => {
        if (scheduleEvents?.length) {
          if (scheduleConfig.scheduleEvent_id) {
            this.scheduleEvents = scheduleEvents.map((el: any) => {
              el.isPlaying = scheduleConfig.scheduleEvent_id === el.id && !scheduleConfig.counterIsPaused
              return el
            })
          } else {
            this.scheduleEvents = scheduleEvents
          }
        }
        this.setCurrentSheduleEvent(this.scheduleEvents)
        this.cdr.detectChanges()
      })
  }

  setCurrentSheduleEvent(scheduleEvents: any[]) {
    this.Store.setCurrentScheduleEvent(scheduleEvents?.[0])
  }

  ngAfterViewInit() {
    // this.cdr.detectChanges()
    console.log('child ngAfterViewInit()')
  }

  ngOnChanges(changes: any) {

    console.log(changes)
  }

  getDiffInMinutes (date1: string, date2: string) {
    return Math.abs(differenceInMinutes(new Date(date1), new Date(date2)))
  }

  getHoursAndMinutes (date: string) {
    return format(new Date(date), 'HH:mm')
  }


  /**
   * resume если
   * переданный ид совпадает с сохраненным ид
   * start если
   * переданный ид не совпадает с сохраненным ид
   * и
   * сейчас не проигрывается ивент
   * change если
   * переданный ид не совпадает с сохраненным ид
   * и
   * сейчас проигрывается ивент
   * */
  handlePlay(el: any) {
    if (el.id === this.Store.getScheduleConfig()?.scheduleEvent_id) {
      this.CounterServ.resumeEvent(el.id)
    } else {
      if (this.Store.getScheduleConfig()?.counterIsPaused) {
        this.CounterServ.startEvent(el.id)
      } else {
        this.CounterServ.changePlayingEvent(el.id)
      }
    }
  }

  pauseEvent(scheduleEvent_id: number) {
    this.CounterServ.pauseEvent(scheduleEvent_id)
  }

  handleSheduleEventClick(el: any) {
    this.Store.setCurrentScheduleEvent(el)
  }

  stopPropagation(event: Event){
    event.stopPropagation()
  }
}
