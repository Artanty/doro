import { Injectable } from "@angular/core";
import { Observable, map } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { SuggestRestReq, SuggestRestRes } from "./api/schedule.types.api";
import { CreateEventReq, SetPlayEventStateReq } from "./api/event.types.api";
import { EventStateReq, EventState, EventStateRes } from "./event/event.types";

@Injectable()
export class ApiService {
	
	private doroBaseUrl = `${process.env['DORO_BACK_URL']}`;

	constructor(
		private http: HttpClient,
	) {}

	public setEventStateApi(data: EventStateReq): Observable<EventState> {
		return this.http.post<EventStateRes>(`${this.doroBaseUrl}/event-state/set-event-state`, data)
			.pipe(
				map(res => res.eventState)
			);
	}

	public suggestRestApi(data: SuggestRestReq): Observable<SuggestRestRes> {
		return this.http.post<{ data: SuggestRestRes }>(`${this.doroBaseUrl}/schedule/suggest-rest`, data).pipe(
			map(res => res.data));
	}

	public createEventApi(payload: CreateEventReq) {
		const apiUrl = `${process.env['DORO_BACK_URL']}/event/create`;
    
		return this.http.post(apiUrl, payload);
	}

	public playEventApi(data: SetPlayEventStateReq): Observable<any> {
		return this.http.post<any>(`${this.doroBaseUrl}/event-state/play`, data)
			.pipe(
				map(res => {
					if (res.data.success) {
						return res.data;
					} else {
						throw new Error('playEventApi wrong response')
					}
				})
			);
	}

}