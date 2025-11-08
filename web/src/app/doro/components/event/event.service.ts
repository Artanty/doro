import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, distinctUntilChanged, filter, map, Observable, throwError } from 'rxjs';
import { DoroEvent, EventWithState } from './event.model';
import { dd } from '../../helpers/dd';
// import { validateShareKeyword } from './edit-keyword/edit-keyword.validation';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private doroBaseUrl = `${process.env['DORO_BACK_URL']}`;
  private tikBaseUrl = `${process.env['TIK_BACK_URL']}`;
  

  constructor(private http: HttpClient) {}

  // Get all entries for current user from events db
  // get current connections
  getAllEvents(): Observable<DoroEvent[]> {
    return this.http.post<DoroEvent[]>(`${this.doroBaseUrl}/event-state/list`, null);
  }

  getUserEventsWithState(): Observable<EventWithState[]> {
    return this.http.post<EventWithState[]>(`${this.doroBaseUrl}/event-state/list-by-user`, null);
  }

  // poolId - project + namespace + feature + entryId:
  // doro@web_events_1
  public playEvent(id: number) {
    dd('playEvent')
    const poolId = 'doro@web_events_1'
    const connId = 'user1'
    this.listenConnectionState(connId).subscribe(res => {
      dd('UEAH!!!')
      dd(res)
    })
    
    this._connectToTikPool(poolId, connId)
    
    // set-event-state
    // this.http.post<EventWithState[]>(`${this.baseUrl}/list-by-user`, null);
  }

  private _connectionsState = new BehaviorSubject<Map<string, any>>(new Map());

  private setConnectionState(connId: string, connValue: any) {
    const conns = this._connectionsState.getValue()
    conns.set(connId, connValue)
    this._connectionsState.next(conns)
  }
  public listenConnectionState(connId: string): Observable<any> {
    return this._connectionsState.asObservable().pipe(
      map(connectionsMap => connectionsMap.get(connId)),
      distinctUntilChanged(),
      filter(value => value !== undefined)
    );
  }
 
  //connId is not reqiured
  private _connectToTikPool(poolId: string, connId: any) {
    dd(this.tikBaseUrl)
    dd(`${process.env['TIK_BACK_URL']}`)
    const eventSource = new EventSource(`${this.tikBaseUrl}/sse/${poolId}/${connId}`);
    
    eventSource.onmessage = (e) => {
      const data = JSON.parse(e.data);
      // console.log(data)
      // console.log(`Pool ${poolId} time:`, data.value);
      
      // Convert to MM:SS
      const mins = Math.floor(data.value / 60);
      const secs = data.value % 60;
      // document.getElementById('timer').textContent = 
      //   `${mins}:${secs.toString().padStart(2, '0')}`;
      dd(`${mins}:${secs.toString().padStart(2, '0')}`)

      if (data.type && data.type === 'init') {
        this.setConnectionState(connId, data.type)
      }
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