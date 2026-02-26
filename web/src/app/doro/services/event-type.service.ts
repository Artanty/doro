import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { map, Observable } from "rxjs";

export interface EventType {
	id: number;
	name: string;
	sort_order: number;
}
@Injectable(
	// {
	//   providedIn: 'root'
	// }
)
export class EventTypeService {
	private doroBaseUrl = `${process.env['DORO_BACK_URL']}`;

	constructor(
		private http: HttpClient,
    
	) {
    
	}

	getEventTypes(): Observable<EventType[]> {
		return this.http
			.post<any>(`${this.doroBaseUrl}/eventType/list`, null)
			.pipe(
				map(res => res.data)
			)
	}
}




