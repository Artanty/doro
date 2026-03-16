import { HttpClient } from "@angular/common/http";
import { Injectable, Inject } from "@angular/core";
import { BehaviorSubject, Observable, delay, tap, map, catchError, of, throwError, distinctUntilChanged, filter } from "rxjs";
import { EVENT_BUS_LISTENER, BusEvent } from "typlib";
import { dd } from "../helpers/dd";
import { filterStreamDataEntries } from "../helpers/filterStreamDataEntries";
import { AppStateService } from "./app-state.service";
import { EventMapperService } from "./event.mapper";
import { GetRecentRes } from "./event.dto";
import { EventProps, GetUserEventsRes, EventStateReq, EventState, EventStateRes, SetPlayEventStateReq, EventStateResItem } from "./event.types";

@Injectable(
  // {
  //   providedIn: 'root'
  // }
)
export class EventService {
  private doroBaseUrl = `${process.env['DORO_BACK_URL']}`;
  private tikBaseUrl = `${process.env['TIK_BACK_URL']}`;

  public events$ = new BehaviorSubject<EventProps[]>([]);

  constructor(
    private http: HttpClient,
    @Inject(EVENT_BUS_LISTENER)
    private readonly eventBusListener$: Observable<BusEvent>,
    private _appStateService: AppStateService,
    private _eventMapperService: EventMapperService
  ) {
    this.eventBusListener$.subscribe(res => {
      // dd(res)
    });
    
  }

  public createEvent(payload: any) {
    const apiUrl = `${process.env['DORO_BACK_URL']}/event/create`;
    return this.http.post(apiUrl, payload).pipe(delay(1000))
  }

  public addToSchedule(eventId: number, scheduleId: number): Observable<unknown> {
    const payload = {
      id: eventId,
      schedule_id: scheduleId
    }
    return this.updateEventApi(payload).pipe(
      tap(() => {
        /**
         * Принудительно обновляем состояние текущего клиента
         * путём изменения локального configHash.
         * В большинстве случаев хэши совпадут, так как флоу:
         * doro@web -> doro@back (set hash=1) -> tik@back -> tik@web -> doro@web (get hash=1)
         * doro@web -> doro@back (set hash=1) -> doro@web (get hash=1)
         * Не совпадут они только из-за разной скорости соединения с серверами.
         * Такое решение делает предсказуемое зеркальное поведение у всех клиентов.
         * */
        this._appStateService.configHash.next(999);
      }))
      
  }
  public listenEvents() {
    return this.events$.asObservable();
  }

  getUserEventsApi(): Observable<GetUserEventsRes> {
    return this.http.post<GetUserEventsRes>(`${this.doroBaseUrl}/event/get`, null);
  }

  setEventStateApi(data: EventStateReq): Observable<EventState> {
    return this.http.post<EventStateRes>(`${this.doroBaseUrl}/event-state/set-event-state`, data)
      .pipe(
        map(res => res.eventState)
      );
  }

  playEventApi(data: SetPlayEventStateReq): Observable<any> {
    return this.http.post<any>(`${this.doroBaseUrl}/event-state/play`, data)
      .pipe(
        map(res => {
          dd(res)
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

  deleteEventApi(data: { id: number }): Observable<boolean> {
    return this.http.post<any>(`${this.doroBaseUrl}/event/delete`, data)
      .pipe(
        map(res => {
          if (res.data.success) {
            return true;
          } else {  
            throw new Error('deleteEventApi wrong response')
          }
        })
      );
  }

  loadEvents(): Observable<boolean> {
    return this.getUserEventsApi()
      .pipe(
        tap((res: GetUserEventsRes) => {
          const data: EventProps[] = res.data;
          if (!data) throw new Error('wrong response format');

          this.events$.next(data)
        }),
        catchError((err: any) => {
          dd(err)
          return of(false);
        }),
        map(() => true),
      )
  }

  public loadRecentEventOrSchedule() {
    return this.http.post<GetRecentRes>(`${this.doroBaseUrl}/event-state/get-recent-event-or-schedule`, null)
      .pipe(
        tap((res: GetRecentRes) => {
          dd(res)
          let events: EventProps[] = [];
          const { recentEvent, recentSchedule } = res.data;
          if (recentEvent) {
            events = [this._eventMapperService.eventDtoToModel(recentEvent)];
          }
          if (recentSchedule) {
            if (recentSchedule.events) {
              events = recentSchedule.events.map(el => this._eventMapperService.eventDtoToModel(el));  
            }
          }
          dd(events)
          this.events$.next(events);
        }),
        catchError((err: any) => {
          dd(err)
          return of(false);
        }),
        map(() => true),
      )
  }
  // staticEventsState$
  public getRecentEventOrSchedule() {
    return this.http.post<any>(`${this.doroBaseUrl}/event-state/get-recent-event-or-schedule`, null)
      .pipe(
        tap((res: GetUserEventsRes) => {
          const data: EventProps[] = res.data;
          if (!data) throw new Error('wrong response format');

          this.events$.next(data)
        }),
        catchError((err: any) => {
          dd(err)
          return of(false);
        }),
        map(() => true),
      )
  }

  // flow: doro@web -> doro@back -> tik@back -> tik@web -> doro@web
  //   // сначала сделать запрос на свой бэк. +
  //   // обновить стейт. +
  //   // оповестить всех пользователей, которые имеют доступ к этому событию 
  //   // (создать новый хэш, чтобы при сравнении стало понятно, что нужно подтянуть изменения)
  public playEvent(eventId: number, isGuiEvent: boolean): void {
    dd('eventService.playEvent');
  
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
          const eventsToUpdate = this.events$.getValue();
          eventsToUpdate.push(...res.addedEvents)
          this.events$.next(eventsToUpdate);
        }
      }
    })   
  }

  public deleteEvent(id: number) {
    this.deleteEventApi({ id: id }).pipe(
      tap(() => {
        const currentEvents = this.events$.getValue();
        const updatedEvents = currentEvents.filter(e => e.id !== id);
        this.events$.next(updatedEvents);
      }),
      catchError(error => {
        console.error('Failed to delete event:', error);
        return throwError(() => new Error(`Failed to delete event ${id}: ${error.message}`));
      }),
    ).subscribe()
  }

  public pauseEvent(eventId: number) {
    const poolId = `doro@web_events_${eventId}`
    const connId = 'doro'
    return this.setEventStateApi({
      "eventId": eventId, 
      "state": 2
    })
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
}