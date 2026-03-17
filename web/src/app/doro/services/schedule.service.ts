import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { BehaviorSubject, catchError, finalize, map, Observable, of, shareReplay, tap } from "rxjs";
import { dd } from "../helpers/dd";
import { EventService } from "./event.service";
import { EventProps } from "./event.types";
import { AppStateService } from "./app-state.service";


export interface Schedule {
	events: never[];
	id: number;
	name: string;
	created_by: string;
	created_at: string;
	updated_at: string;
}

@Injectable()

export class ScheduleService {
	private doroBaseUrl = `${process.env['DORO_BACK_URL']}`;
	_appStateService: any;
	events$: any;
	

	constructor(
		private http: HttpClient,
		private _state: AppStateService,
	) {}

	private cache$: Observable<Schedule[]> | null = null;
	private isFetching = false;
  
	// Optional: loading state for UI
	loading$ = new BehaviorSubject<boolean>(false);

	getSchedules(): Observable<Schedule[]> {
		if (this.isFetching && this.cache$) {
			return this.cache$;
		}
    
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

	
	public getScheduleWithEvents(scheduleId: number): Observable<boolean> {
		const payload = {
			scheduleId: scheduleId
		}
		return this.http.post<{ data: Schedule }>(`${this.doroBaseUrl}/schedule/get-by-id-with-events`, payload)
			.pipe(
				map(res => res.data),
				tap((res: Schedule) => {
					const events = res.events ?? [];
					// this._appStateService.currentSchedule.next(recentSchedule)
					this._state.events.next(events);
				}),
				catchError((err: any) => {
					dd(err)
					return of(false);
				}),
				map(() => true),
			)
	}

	public getNextEventsOfSchedule(scheduleId: number, event: EventProps): EventProps[] {
		dd('getNextEventsOfSchedule')
		const bySchedule = this._getEventsBySchedule(scheduleId);
		bySchedule.sort((a, b) => {
			return Number(b.schedule_position) - Number(a.schedule_position)
		})
		const filtered = bySchedule
			.filter(el => Number(el.schedule_position) > Number(event.schedule_position));

		return filtered;
	}

	private _getEventsBySchedule(scheduleId: number): EventProps[] {
		return this._state.events.getValue()
			.filter(event => event.schedule_id === scheduleId)
	}

	public getNextPositionInSchedule(scheduleId: number) {

		const filteredBySchedule = this._state.events.getValue().filter(
			e => e.schedule_id === scheduleId);

		const sorted = filteredBySchedule.sort((a, b) => {
			return Number(b.schedule_position) - Number(a.schedule_position)
		});

		const removedNulls = sorted.filter(el => typeof el.schedule_position === 'number');

		const current = removedNulls[0]?.schedule_position;
		
		const result = typeof current === 'number'
			? (current + 1)
			: 0;
		
		return result
	}
}