import { ChangeDetectorRef, Inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, distinctUntilChanged, filter, map, Observable, of, throwError, catchError, switchMap, tap, Subject, take } from 'rxjs';
import { EventProps, EventState, EventStateReq, EventStateRes, EventWithState, SetPlayEventStateReq } from './event.model';
import { dd } from '../../helpers/dd';
import { basicEventTypePrefix, devPoolId, EventProgressType, EventStates } from '../../constants';
import { BusEvent, EVENT_BUS_LISTENER, EVENT_BUS_PUSHER } from 'typlib';

import { filterStreamDataEvents } from '../../helpers/filterStreamDataEvents';
// import { validateShareKeyword } from './edit-keyword/edit-keyword.validation';

export interface EventStateResItem {
  id: string,
  cur: number,
  len: number,
  prc: number,
  stt: EventProgressType
}

export interface EventData {
  data: any
  state: string
  initialEvent: EventWithState
}


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
  ) {
    this.eventBusListener$.subscribe(res => {
      // dd(res)
    })
  }

  public listenEvents() {
    return this.events$.asObservable();
  }
  // Get all entries for current user from events db
  // get current connections
  getAllEvents(): Observable<EventProps[]> {
    return this.http.post<EventProps[]>(`${this.doroBaseUrl}/event-state/list`, null);
  }

  // getUserEventsWithStateApi(): Observable<EventProps[]> {
  //   return this.http.post<EventProps[]>(`${this.doroBaseUrl}/event-state/list-by-user`, null);
  // }

  getUserEventsApi(): Observable<EventProps[]> {
    return this.http.post<EventProps[]>(`${this.doroBaseUrl}/event/list`, null);
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
        take(1),
        tap((res: EventProps[]) => {
          dd(res)
          this.events$.next(res)
        }),
        catchError((err: any) => {
          return of(false);
        }),
        map(() => true),
      )
    // .subscribe()
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
  
  // public listenEventState(eventId: number): Observable<EventStateResItem> {
  //   return this.eventBusListener$.pipe(
  //     filter(filterStreamDataEvents),
  //     map((busEvent: BusEvent<EventStateResItem[]>): EventStateResItem => {
  //       const receivedEventId = `${basicEventTypePrefix}_${eventId}`
  //       const foundEvent = busEvent.payload.find(event => event.id === receivedEventId)
  //       if (!foundEvent) {
  //         return null;
  //       }
  //       return foundEvent;
  //     }),
  //     filter(Boolean)
  //   )
  // }
  public listenEventState(eventId: number): Observable<EventStateResItem> {
    const receivedEventId = `${basicEventTypePrefix}_${eventId}`;
  
    return this.eventBusListener$.pipe(
      filter(filterStreamDataEvents),
      map((busEvent: BusEvent<EventStateResItem[]>): EventStateResItem | null => {
        const foundEvent = busEvent.payload.find(event => event.id === receivedEventId);
        return foundEvent || null;
      }),
      filter((event): event is EventStateResItem => event !== null),
    );
  }

  private _connectToTikPool() {
    
  }

  // // Get single keyword
  // getKeyword(id: number): Observable<Keyword> {
  //   const data = { id: id }
  //   return this.http.post<Keyword>(`${this.baseUrl}/get-one`, data);
  // }

  // // Create new keyword
  // createKeyword(keyword: { name: string; color: number }): Observable<Keyword> {
  //   return this.http.post<Keyword>(`${this.baseUrl}/create`, {
  //     ...keyword,
  //   });
  // }

  // // Update keyword
  // updateKeyword(keyword: { id: number, name?: string; color?: number }): Observable<Keyword> {
  //   const data = keyword
  //   return this.http.post<Keyword>(`${this.baseUrl}/update`, data);
  // }



  // // get list of users that have access to keyword
  // public getKeywordUsers(keywordId: number): Observable<KeywordUser[]> {
  //   const data = {
  //     "keywordId": keywordId
  //   }
  //   return this.http.post<KeywordUsersRes>(`${this.baseUrl}/users/list`, data).pipe(
  //     map(res => {
  //       return res.enrichedUsersData
  //     }));
  // }
  


  // // Share keyword with another user
  // shareKeyword(
  //   keywordId: number, 
  //   targetUserProviderId: string,
  //   targetUserId: string, 
  //   accessLevel: number
  // ): Observable<ShareKeywordRes> {
  //   validateShareKeyword(keywordId, targetUserProviderId, targetUserId, accessLevel)
  //   return this.http.post<ShareKeywordRes>(`${this.baseUrl}/share`, {
  //     keywordId: keywordId,
  //     targetUserProviderId: targetUserProviderId,
  //     targetUserId: targetUserId,
  //     accessLevel: accessLevel,
  //   });
  // }

  // // Share keyword with another user
  // unshareKeyword(
  //   keywordId: number, 
  //   targetUserProviderId: string,
  //   targetUserId: string, 
    
  // ): Observable<ShareKeywordRes> {
  //   return this.http.post<ShareKeywordRes>(`${this.baseUrl}/unshare`, {
  //     keywordId: keywordId,
  //     targetUserProviderId: targetUserProviderId,
  //     targetUserId: targetUserId,
  //   });
  // }

  public getAccessLevels() {
    return [
      { id: 1, name: 'Просмотр' },
      { id: 2, name: 'Изменение' },
      { id: 3, name: 'Админ' },
      { id: 4, name: 'Владелец' },
    ]
  }
}