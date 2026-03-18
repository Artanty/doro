import { Injectable } from "@angular/core";
import { EventState, EventStateReq, EventStateRes } from "./event.types";
import { Observable, map } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { SuggestRestReq, SuggestRestRes } from "./api/schedule.types.api";

@Injectable()
export class ApiService {
	
	private doroBaseUrl = `${process.env['DORO_BACK_URL']}`;

	constructor(
		private http: HttpClient,
	) {}

	setEventStateApi(data: EventStateReq): Observable<EventState> {
		return this.http.post<EventStateRes>(`${this.doroBaseUrl}/event-state/set-event-state`, data)
			.pipe(
				map(res => res.eventState)
			);
	}

	suggestRestApi(data: SuggestRestReq): Observable<SuggestRestRes> {
		return this.http.post<{ data: SuggestRestRes }>(`${this.doroBaseUrl}/schedule/suggest-rest`, data).pipe(
			map(res => res.data));
	}
}