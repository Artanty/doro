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

  public playEvent(eventId: number, isGuiEvent: boolean): void {
    this._api.playEventApi({ "eventId": eventId }).pipe(
      catchError(error => {
        console.error('Failed to play event:', error);
        return throwError(() => new Error(`Failed to play event ${eventId}: ${error.message}`));
      })
    ).subscribe((res: any) => {
      this._state.configHash.next(999);
    })   
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
    const payload: any = {
      "eventId": eventId, 
      "state": 2
    }
    return this.http.post<any>(`${this.doroBaseUrl}/event-state/pause`, payload).pipe(
      tap(() => {
        this._state.configHash.next(999);
      }))
  }
  
  //EventTypePrefix
  public listenEventState(eventTypePrefix: string, eventId: number): Observable<EventStateResItem> {
    const receivedEventId = `${eventTypePrefix}_${eventId}`;
  
    return this.eventBusListener$.pipe(
      filter(filterStreamDataEntries),
      map((busEvent: BusEvent<EventStateResItem[]>): EventStateResItem | null => {
        const foundEvent = busEvent.payload.find(event => event.id === receivedEventId);
        return foundEvent || null;
      }),
      filter((event): event is EventStateResItem => event !== null),
    );
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