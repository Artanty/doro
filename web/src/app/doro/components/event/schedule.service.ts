import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { BehaviorSubject, finalize, map, Observable, shareReplay } from "rxjs";

export interface Schedule {
	id: number;
	name: string;
	created_by: string;
	created_at: string;
	updated_at: string;
}

@Injectable({ providedIn: 'root' })
export class ScheduleService {
	private doroBaseUrl = `${process.env['DORO_BACK_URL']}`;
	

	constructor(private http: HttpClient) {}

	private cache$: Observable<Schedule[]> | null = null;
	private isFetching = false;
  
	// Optional: loading state for UI
	loading$ = new BehaviorSubject<boolean>(false);

	getSchedules(): Observable<Schedule[]> {
		// If already fetching, return the ongoing request
		if (this.isFetching && this.cache$) {
			return this.cache$;
		}
    
		// If not fetching and no cache, start new request
		if (!this.cache$) {
			this.isFetching = true;
			this.loading$.next(true);
      
			this.cache$ = this.http.post<any>(`${this.doroBaseUrl}/schedule/list`, null)
				.pipe(
					map(res => res.data),
					shareReplay(1),
					finalize(() => {
						this.isFetching = false;
						this.loading$.next(false);
					})
				);
		}
    
		return this.cache$;
	}
}