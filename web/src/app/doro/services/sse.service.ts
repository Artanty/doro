import { Injectable } from '@angular/core';
import {Observable} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class SseService {
  private _eventSource: EventSource
  constructor() {
    this._eventSource = new EventSource('http://localhost:3000/events');
    this._eventSource.onerror = event => {
      console.log('new EventSource on error:')
      console.log(event)
      this.createEventSource()
    }
  }

  public createEventSource(): Observable<any> {
    return new Observable(observer => {
      this._eventSource.onmessage = event => {
        const messageData: any = JSON.parse(event.data);
        observer.next(messageData);
      };
    });
  }

  public closeSseConnection () {
    this._eventSource.close()
  }

}
