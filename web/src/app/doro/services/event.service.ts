import { HttpClient } from "@angular/common/http";
import { Injectable, Inject } from "@angular/core";
import { BehaviorSubject, Observable, delay, tap, map, catchError, of, throwError, distinctUntilChanged, filter, switchMap } from "rxjs";
import { EVENT_BUS_LISTENER, BusEvent } from "typlib";
import { dd } from "../helpers/dd";
import { filterStreamDataEntries } from "../helpers/filterStreamDataEntries";
import { AppStateService } from "./app-state.service";
import { EventProps, GetUserEventsRes, EventStateReq, EventState, EventStateRes, SetPlayEventStateReq, EventStateResItem } from "./event.types";
import { GetRecentRes } from "./event.types.api";
import { ScheduleService } from "./schedule.service";
import { ApiService } from "./api.service";


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

  public createEvent(payload: any) {
    const apiUrl = `${process.env['DORO_BACK_URL']}/event/create`;
    return this.http.post(apiUrl, payload).pipe(
      switchMap(() => {
        return this.loadEvents(); //self only. others via hash
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

  playEventApi(data: SetPlayEventStateReq): Observable<any> {
    return this.http.post<any>(`${this.doroBaseUrl}/event-state/play`, data)
      .pipe(
        map(res => {
          if (res.data.success) {
            return res.data;
          } else {
            throw new Error('playEventApi wrong response')
          }
        })
      );
  }

  updateEventApi(data: any): Observable<unknown> {
    return this.http
      .post<any>(`${this.doroBaseUrl}/event/update`, data)
      .pipe(
        map(res => res.data)
      )
  }

  // flow: doro@web -> doro@back -> tik@back -> tik@web -> doro@web
  //   // сначала сделать запрос на свой бэк. +
  //   // обновить стейт. +
  //   // оповестить всех пользователей, которые имеют доступ к этому событию 
  //   // (создать новый хэш, чтобы при сравнении стало понятно, что нужно подтянуть изменения)
  public playEvent(eventId: number, isGuiEvent: boolean): void {

  
    this.playEventApi({ "eventId": eventId }).pipe(
      catchError(error => {
        console.error('Failed to play event:', error);
        return throwError(() => new Error(`Failed to play event ${eventId}: ${error.message}`));
      })
      // @ts-ignore
    ).subscribe((res: any) => {
      console.log(res)
      if (res.isDuplicate) {
        if (Array.isArray(res.addedEvents) && res.addedEvents.length) {
          const eventsToUpdate = this._state.events.getValue();
          eventsToUpdate.push(...res.addedEvents)
          this._state.events.next(eventsToUpdate);
        }
      }
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
    const payload: EventStateReq = {
      eventStates: [
        {
          "eventId": eventId, 
          "state": 2
        }
      ]
    }
    return this._api.setEventStateApi(payload)
      .subscribe()
  }
  
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

}