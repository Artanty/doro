import { HttpClient } from "@angular/common/http";
import { Injectable, Inject } from "@angular/core";
import { Observable, tap, catchError, of, map, throwError, filter, first, timeout } from "rxjs";
import { EVENT_BUS_LISTENER, BusEvent } from "typlib";
import { filterStreamDataEntries } from "../../helpers/filterStreamDataEntries";
import { ApiService } from "../common-api/common-api.service";
import { AppStateService } from "../core/app-state.service";
import { ScheduleService } from "../schedule/schedule.service";
import { CreateEventReq } from "./basic-event-api.types";
import { GetUserEventsRes, EventProps, EventStateResItem, EventState, EventStateReq } from "./basic-event.types";
import { EventProgress } from "../../constants";
import { dd } from "../../helpers/dd";
import { PauseEventReq, PlayEventReq } from "@contracts/event-state.contract";


@Injectable()
export class EventService {
  private doroBaseUrl = `${process.env['DORO_BACK_URL']}`;
  private tikBaseUrl = `${process.env['TIK_BACK_URL']}`;

  constructor(
    private http: HttpClient,
    @Inject(EVENT_BUS_LISTENER)
    private readonly eventBusListener$: Observable<BusEvent>,
    private _state: AppStateService,
    private _scheduleService: ScheduleService,
    private _api: ApiService,
  ) {}

  loadEvents(daysInterval: number = 1): Observable<boolean> {
    const filters = {
      interval: daysInterval
    }

    return this.http.post<GetUserEventsRes>(`${this.doroBaseUrl}/event/get`, { filters })
      .pipe(
        tap((res: GetUserEventsRes) => {
          const data: EventProps[] = res.data;
          if (!data) throw new Error('wrong response format');

          this._state.events.next(data)
          dd(this._state.events.getValue())
        }),
        catchError((err: any) => {
          
          return of(false);
        }),
        map(() => true),
      )
  }

  public createEvent(payload: CreateEventReq) {
    return this._api.createEventApi(payload).pipe(
      tap(() => {
        this._state.configHash.next(999);
      }))
  }

  public addToSchedule(eventId: number, scheduleId: number): Observable<unknown> {
    const payload = {
      id: eventId,
      schedule_id: scheduleId,
      schedule_position: this._scheduleService.getNextPositionInSchedule(scheduleId)
    }

    return this.updateEventApi(payload).pipe(
      tap(() => {
        this._state.configHash.next(999);
      }))
      
  }

  updateEventApi(data: any): Observable<unknown> {
    return this.http
      .post<any>(`${this.doroBaseUrl}/event/update`, data)
      .pipe(
        map(res => res.data)
      )
  }

  // {
  //     "id": 921,
  //     "name": "event 1",
  //     "length": 360,
  //     "is_rest": 1,
  //     "schedule_id": 2,
  //     "schedule_name": "schedule id 2",
  //     "schedule_is_playing": 1,
  //     "schedule_position": 1091,
  //     "playhead": 2,
  //     "schedule_owner": "74aa6454c1fcabffea7ff172:324c9c440c841889632429b574a39942",
  //     "is_active_event": 1
  // }

  public playEvent(eventId: number, scheduleId: number): Observable<any> {
    const payload: PlayEventReq = {
      scheduleId: scheduleId,
      eventIdToPlay: eventId,
      playEventPlayhead: 0,
    }
    return this.http.post<any>(`${this.doroBaseUrl}/event-state/play`, payload)
			.pipe(
				map(res => {
					if (res.data.success) {
						return res.data;
					} else {
						throw new Error('playEventApi wrong response')
					}
				}),
        tap(() => {
          this._state.configHash.next(999);
        })
			)  
  }

  public deleteEvent(id: number) {
    const payload = { id: id };
    this.http.post<any>(`${this.doroBaseUrl}/event/delete`, payload).pipe(
      tap(() => {
        const currentEvents = this._state.events.getValue();
        const updatedEvents = currentEvents.filter(e => e.id !== id);
        this._state.events.next(updatedEvents);
      }),
      catchError(error => {
        console.error('Failed to delete event:', error);
        return throwError(() => new Error(`Failed to delete event ${id}: ${error.message}`));
      }),
    ).subscribe()
  }

  public pauseEvent(eventId: number) {
    const payload: PauseEventReq= {
      "eventId": eventId, 
      "state": 2
    }
    return this.http.post<any>(`${this.doroBaseUrl}/event-state/pause`, payload).pipe(
      tap(() => {
        this._state.configHash.next(999);
      }))
  }
  
  // {
//     "id": 921,
//     "name": "event 1",
//     "length": 360,
//     "is_rest": 1,
//     "schedule_id": 2,
//     "schedule_name": "schedule  id 2",
//     "schedule_is_playing": 1,
//     "schedule_position": 1091,
//     "playhead": 2,
//     "schedule_owner": "74aa6454c1fcabffea7ff172:324c9c440c841889632429b574a39942",
//     "is_active_event": 1
// }
//
// 'STOPPED': 0,
// 	'PLAYING': 1,
// 	'PAUSED': 2,
// 	'COMPLETED': 3
  public listenEventState(eventTypePrefix: string, eventProps: any): Observable<EventStateResItem> {
    const tikEventId = `${eventTypePrefix}_${eventProps.id}`;
    // определяем, идет событие ли нет, в зависимости от этого
    // получаем его динамический стейт или статический
    // dd(eventProps.schedule_is_playing)
    // dd(eventProps.is_active_event)
    if (eventProps.schedule_is_playing && eventProps.is_active_event) {
      return this.eventBusListener$.pipe(
        filter(filterStreamDataEntries),
        map((busEvent: BusEvent<EventStateResItem[]>): EventStateResItem | null => {
          const foundEvent = busEvent.payload.find(event => event.id === tikEventId);
          return foundEvent || null;
        }),
        filter((event): event is EventStateResItem => event !== null),
      );
    } else {
      return of({
          id: tikEventId, // no need here
          cur: eventProps.playhead,
          len: eventProps.length,
          stt: EventProgress.STOPPED
      })
    }
  }

  public getAccessLevels() {
    return [
      { id: 1, name: 'Просмотр' },
      { id: 2, name: 'Изменение' },
      { id: 3, name: 'Админ' },
      { id: 4, name: 'Владелец' },
    ]
  }

  public finishEvent(eventId: number): Observable<EventState> {
    const payload: EventStateReq = {
      eventStates: [
        {
          "eventId": eventId, 
          "state": 3
        }
      ]
    }
    return this._api.setEventStateApi(payload).pipe(
      tap(() => {
        this._state.configHash.next(999);
      })
    )   
  }

  public finishEventRunHooks(eventId: number): Observable<any> {
    const payload: any = {
      "eventId": eventId, 
      "state": 3
    }
    return this.http.post<any>(`${this.doroBaseUrl}/event-state/stop`, payload).pipe(
      tap(() => {
        this._state.configHash.next(999);
      }))   
  }

  public waitForEventProps(eventId: number): Observable<EventProps> {
    console.log(`Waiting for event ${eventId} to appear...`);
    
    return this._state.events.listen().pipe(
      filter(events => {
        const exists = events.some(e => e.id === eventId);
        if (exists) console.log(`Event ${eventId} found!`);
        return exists;
      }),
      map(events => {
        // Find and return the actual event object
        const foundEvent = events.find(e => e.id === eventId);
        console.log('Returning event object:', foundEvent);
        return foundEvent!; // Non-null assertion since we filtered
      }),
      first(), // Complete after first emission
      timeout(10000),
      catchError(err => {
        console.error(`Event ${eventId} never appeared`);
        return throwError(() => err);
      })
    );
  }

}