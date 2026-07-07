import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, map } from "rxjs";
import { CreateEventReq } from "../basic-event/basic-event-api.types";
import { EventStateReq, EventState, EventStateRes } from "../basic-event/basic-event.types";
import { SuggestRestReq, SuggestRestRes } from "../schedule/schedule.api.types";
import { CreateEventRes } from "@contracts/event.contract";

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

	public createEventApi(payload: CreateEventReq): Observable<CreateEventRes> {
		const apiUrl = `${process.env['DORO_BACK_URL']}/event/create`;
    
		return this.http.post<CreateEventRes>(apiUrl, payload);
	}

	public getTikLogsApi(payload = {}): Observable<any> {
		// const apiUrl = `${process.env['DORO_BACK_URL']}/event/create`;
		const apiUrl = 'http://localhost:3202/logs';
		
		return this.http.post<any>(apiUrl, payload);
	}	

}