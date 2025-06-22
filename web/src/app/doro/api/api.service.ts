import {HttpClient} from "@angular/common/http";
import { Inject, Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor (
    @Inject(HttpClient) private http: HttpClient
  ) {}

  requestScheduleEvents (id: number) {
    return this.http.post(`${process.env['SERVER_URL']}/getScheduleEvents`, {
      id
    })

  }

  requestSchedule (id: number) {
    return this.http.post(`${process.env['SERVER_URL']}/getSchedule`, {
      id
    })
  }
}
