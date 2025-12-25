import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { catchError, map, Observable, of } from "rxjs";
import { dd } from "./doro/helpers/dd";
import { MockBackService } from "./app.mock.back.service";

@Injectable()
export class MockInterceptor implements HttpInterceptor {
  constructor(
    private _mockTikService: MockBackService
  ) {}
  private doroBackBaseUrl = `${process.env['DORO_BACK_URL']}`;

  private urlsMap = new Map<any, any>([
    [`${this.doroBackBaseUrl}/event/list`, getEventList],
    [`${this.doroBackBaseUrl}/event-state/play`, this._playEvent.bind(this)],
    [`${this.doroBackBaseUrl}/event-state/set-event-state`, this._pauseEvent.bind(this)],

  ]) 

  intercept(req: HttpRequest<any>, handler: HttpHandler): Observable<HttpEvent<any>> {
    // console.log('Request URL: ' + req.url);

    return handler.handle(req).pipe(
      map(res => {
        return this._matchUrl(req.url, req.body, res)
      }),
      catchError((err, req) => {
        const res = new HttpResponse({
          body: this._matchUrl(err.url, err.body, err.message),
        });
        return of(res);
      })
    );

  }

  private _matchUrl(url: string, payload: any, res: any): any {
    let newRes = res;
    const matched = this.urlsMap.get(url)
    if (matched) {
      dd(url + ' => ' + matched.name + '()')
      newRes = matched(payload)
    }
    return newRes;
  }

  private _playEvent(req: any) {
    this._mockTikService.playEvent(req);
    return {
      data: {
        success: true,
      }
    }
  }

  private _pauseEvent(req: any) {
    this._mockTikService.pauseEvent(req);
    return {}
  }
}


export const getEventList = (data: any) => {
  return [
    {
      "id": 209,
      "name": "Morning Focus 5",
      "length": 25,
      "type": 2,
      "created_at": "2025-12-19T22:42:24.000Z",
      "type_name": "Работа",
      "access_level": "owner"
    },
    {
      "id": 208,
      "name": "Morning Focus 5",
      "length": 25,
      "type": 2,
      "created_at": "2025-12-19T22:40:27.000Z",
      "type_name": "Работа",
      "access_level": "owner"
    },
    {
      "id": 207,
      "name": "Morning Focus 5",
      "length": 25,
      "type": 2,
      "created_at": "2025-12-18T21:25:08.000Z",
      "type_name": "Работа",
      "access_level": "owner"
    }
  ]
}