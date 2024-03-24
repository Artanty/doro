import {HttpClient} from "@angular/common/http";
import {SERVER_URL} from "../../../../env";
import { Inject, Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor (
    @Inject(HttpClient) private http: HttpClient
  ) {}

  requestScheduleEvents (id: number) {
    return this.http.post(`${SERVER_URL}/getScheduleEvents`, {
      id
    })

  }

  requestSchedule (id: number) {
    return this.http.post(`${SERVER_URL}/getSchedule`, {
      id
    })
  }
}
