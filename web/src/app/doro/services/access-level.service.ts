import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { map, Observable } from "rxjs";

export interface AccessLevel {
	id: number;
	name: string;
	description: string;
	sort_order: number;
}
@Injectable(
	// {
	//   providedIn: 'root'
	// }
)
export class AccessLevelService {
	private doroBaseUrl = `${process.env['DORO_BACK_URL']}`;

	constructor(
		private http: HttpClient,
    
	) {
    
	}

	getAccessLevels(): Observable<AccessLevel[]> {
		return this.http
			.post<any>(`${this.doroBaseUrl}/access-level/list`, null)
			.pipe(
				map(res => res.data)
			)
	}
}

