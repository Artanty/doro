import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, distinctUntilChanged, filter, map, Observable, of, throwError, catchError, switchMap, tap, Subject } from 'rxjs';
import { DoroEvent, EventState, EventStateReq, EventStateRes, EventWithState } from './event.model';
import { dd } from '../../helpers/dd';
// import { validateShareKeyword } from './edit-keyword/edit-keyword.validation';


export interface EventData {
  formattedTime: string,
  minutes: number,
  raw: {
    config: string,
    globalTime: number
    poolId: string,
    value: number, 
  },
  seconds: number,
  totalSeconds: number,
  state: string
}

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private doroBaseUrl = `${process.env['DORO_BACK_URL']}`;
  private tikBaseUrl = `${process.env['TIK_BACK_URL']}`;

  private eventStreams$ = new BehaviorSubject<Map<string, EventData>>(new Map());
  
  // public eventList$ = new BehaviorSubject<EventWithState[]>([]);
  constructor(private http: HttpClient) {}

  // Get all entries for current user from events db
  // get current connections
  getAllEvents(): Observable<DoroEvent[]> {
    return this.http.post<DoroEvent[]>(`${this.doroBaseUrl}/event-state/list`, null);
  }

  getUserEventsWithState(): Observable<EventWithState[]> {
    return this.http.post<EventWithState[]>(`${this.doroBaseUrl}/event-state/list-by-user`, null);
  }

  setEventStateApi(data: EventStateReq): Observable<EventState> {
    return this.http.post<EventStateRes>(`${this.doroBaseUrl}/event-state/set-event-state`, data)
      .pipe(
        map(res => res.eventState)
      );
  }

  //   // сначала сделать запрос на свой бэк. +
  //   // обновить стейт. +
  //   // оповестить всех пользователей, которые имеют доступ к этому событию 
  //   // (создать новый хэш, чтобы при сравнении стало понятно, что нужно подтянуть изменения)
  public playEvent(eventId: number, isGuiEvent: boolean = false): void {
    dd('eventService.playEvent');
  
    const poolId = `doro@web_events_${eventId}`;
    const connId = 'doro';
  
    const doroBackUpdate$ = isGuiEvent 
      ? this.setEventStateApi({ "eventId": eventId, "connectionId": "", "state": 1 })
      : of(null);
  
    doroBackUpdate$.pipe(
      // @ts-ignore
      tap((res: any) => {
        this._connectToTikPool(poolId, connId)
      }),
      catchError(error => {
        console.error('Failed to play event:', error);
        return throwError(() => new Error(`Failed to play event ${eventId}: ${error.message}`));
      })
      // @ts-ignore
    ).subscribe((res: any) => {})   
  }

  public pauseEvent(eventId: number) {
    const poolId = `doro@web_events_${eventId}`
    const connId = 'doro'
    return this.setEventStateApi({
      "eventId": eventId, 
      "connectionId": "", 
      "state": 2
    })
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
  
  public listenEventState(eventId: number): Observable<EventData> {
    const poolId = `doro@web_events_${eventId}`;
    return this.eventStreams$.asObservable().pipe(
      map(data => data.get(poolId)!), // catch and mock
      distinctUntilChanged(),
      filter(value => value !== undefined)
    );
  }

  // для идентификации пользователя в tik@ используется fingerprint,
  // потому что один пользователь может сидеть с разных устройств одновременно.
  // poolId - doro@web_events_1 (по сути eventId)
  private _connectToTikPool(poolId: string, connId: any): void {
 
    const eventSource = new EventSource(`${this.tikBaseUrl}/sse/${poolId}`);
  
    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        const mins = Math.floor(data.value / 60);
        const secs = data.value % 60;
        const formattedTime = `${mins}:${secs.toString().padStart(2, '0')}`;
      
        const eventValue: EventData = {
          raw: data,
          formattedTime: formattedTime,
          minutes: mins,
          seconds: secs,
          totalSeconds: data.value,
          state: 'isRunning' // replace to tik back?
        }

        const streams = this.eventStreams$.getValue()
        streams.set(poolId, eventValue)
        this.eventStreams$.next(streams)

        if (data.type && data.type === 'init') {
          this.setConnectionState(connId, data.type);
        }
      } catch (error) {
        console.error(error);
      }
    };
  
    eventSource.onerror = (error) => {
      console.error(error);

      const streams = this.eventStreams$.getValue()
      streams.delete(poolId);
      this.eventStreams$.next(streams)

      
      eventSource.close();
    };
  
    
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

  deleteEvent(id: number): Observable<any> {
    const data = { id: id }
    return this.http.post<any>(`${this.doroBaseUrl}/event/delete`, data);
  }

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