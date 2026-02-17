import { ChangeDetectorRef, Inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, distinctUntilChanged, filter, map, Observable, of, throwError, catchError, switchMap, tap, Subject, take, delay } from 'rxjs';
import { EventProps, EventState, EventStateReq, EventStateRes, EventStateResItem, EventWithState, GetUserEventsRes, SetPlayEventStateReq } from './event.types';
import { dd } from '../../helpers/dd';
import { basicEventTypePrefix, devPoolId, EventProgressType, EventStates } from '../../constants';
import { BusEvent, EVENT_BUS_LISTENER, EVENT_BUS_PUSHER } from 'typlib';

import { filterStreamDataEntries } from '../../helpers/filterStreamDataEntries';
import { AppStateService } from '../../services/app-state.service';
import { obs$ } from '../../utilites/observable-variable';
import { GetRecentRes } from './event.dto';
import { EventMapperService } from './event.mapper';
// import { validateShareKeyword } from './edit-keyword/edit-keyword.validation';

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
    })
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
    return this.http.post<GetUserEventsRes>(`${this.doroBaseUrl}/event/list`, null);
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

  deleteEventApi(data: { id: number }): Observable<number[]> {
    return this.http.post<any>(`${this.doroBaseUrl}/event/delete`, data)
      .pipe(
        map(res => {
          if (res.data.success && res.data.ids) {
            return res.data.ids
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
          let events: EventProps[] = [];
          const { recentEvent, recentSchedule } = res.data;
          if (recentEvent) {
            events = [this._eventMapperService.eventDtoToModel(recentEvent)];
            // ? неправильно держать recentEvent в глобальном стейте,
            // когда клиент обновляет состояние вслед за 
            // изменениями другого клиента, но находится в другом интерфейсе
            // данное изменение для него неактуально.

            // данные, полученные в ответ на запрос - провоцируют не консистентное состояние.
            // сразу после зпроса состояние бэка может быть изменено - решего с пом хэша
            this._appStateService.recentEvent.next(recentEvent.id);
          }
          if (recentSchedule) {
            if (recentSchedule.events) {
              events = recentSchedule.events.map(el => this._eventMapperService.eventDtoToModel(el));  
            }
            
            this._appStateService.currentSchedule.next(recentSchedule)
          }
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
      tap((idsToDelete: number[]) => {
        const currentEvents = this.events$.getValue();
        const updatedEvents = currentEvents.filter(e => !idsToDelete.includes(e.id));
        this.events$.next(updatedEvents);
      }),
      catchError(error => {
        console.error('Failed to delete event:', error);
        return throwError(() => new Error(`Failed to delete event ${id}: ${error.message}`));
      }),
    ).subscribe()
  }

  public deleteEvent2(id: number) {
    return this.deleteEventApi({ id: id }).pipe(
      tap((idsToDelete: number[]) => {
        const currentEvents = this.events$.getValue();
        const updatedEvents = currentEvents.filter(e => !idsToDelete.includes(e.id));
        this.events$.next(updatedEvents);
      }),
      catchError(error => {
        console.error('Failed to delete event:', error);
        return throwError(() => new Error(`Failed to delete event ${id}: ${error.message}`));
      }),
    )
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

  


  private _connectionsState = new BehaviorSubject<Map<string, any>>(new Map());

  private setConnectionState(connId: string, connValue: any): void {
    const conns = this._connectionsState.getValue()
    conns.set(connId, connValue)
    this._connectionsState.next(conns)
  }

  public listenConnectionState(connId: string): Observable<string> {
    return this._connectionsState.asObservable().pipe(
      tap(console.log),
      map(connectionsMap => connectionsMap.get(connId)),
      distinctUntilChanged(),
      filter(value => value !== undefined)
    );
  }
  
  public listenEventState(eventId: number): Observable<EventStateResItem> {
    const receivedEventId = `${basicEventTypePrefix}_${eventId}`;
  
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