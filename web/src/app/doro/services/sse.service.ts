import { Inject, Injectable } from '@angular/core';
import {Observable, filter} from "rxjs";
import { StoreService } from './store.service';
import { ITick } from '../models/tick.model';

@Injectable({
  providedIn: 'root'
})
export class SseService {
  private _eventSource: EventSource
  constructor(
    @Inject(StoreService) private StoreServ: StoreService
  ) {
    this._eventSource = new EventSource('http://localhost:3000/events');
    this._eventSource.onerror = event => {
      this.createEventSource()
    }
  }

  public createEventSource(): void {
    new Observable(observer => {
      this._eventSource.onmessage = event => {
        const messageData: any = JSON.parse(event.data);
        observer.next(messageData);
      }
    }).subscribe({
      next: (res: any) => {
        this.StoreServ.setTick(res)
      }
    })
  }

  public listenTick (): Observable<ITick> {
    return this.StoreServ.listenTick().pipe(filter(Boolean))
  }

  public closeSseConnection () {
    this._eventSource.close()
  }

}
