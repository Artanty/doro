
import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, BehaviorSubject, map, shareReplay, finalize, tap, catchError, of, filter, Subject, switchMap } from "rxjs";
import { filterBasicEvents } from "../../helpers/filterBasicEvents";
import { EventProps } from "../basic-event/basic-event.types";
import { AppStateService } from "../core/app-state.service";
import { Schedule } from "./schedule.types";
import { CreateFullScheduleReq, CreateScheduleRes, ScheduleListRes, ScheduleListResDataItem } from "@contracts/schedule.contracts";
import { dd } from "@helpers/dd";

@Injectable()
export class ScheduleService {
	private doroBaseUrl = `${process.env['DORO_BACK_URL']}`;
	_appStateService: any;
	events$: any;
	
	private schedulesSubject = new BehaviorSubject<Schedule[]>([]);
    public schedules$ = this.schedulesSubject.asObservable();
    private isReady = false;
    private isFetching = false;
    private refreshTrigger = new Subject<void>();

	constructor(
		private http: HttpClient,
		private _state: AppStateService,
	) {
		this.connectEventsProvider();
	}	

	connectEventsProvider() {
		this._state.schedules.setProvider(this._loadSchedulesApi.bind(this))
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

					return of(false);
				}),
				map(() => true),
			)
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

	// public getLastEventOfSchedule (scheduleId: number): EventProps {
	// 	const filteredBySchedule = this._state.events.getValue().filter(
	// 		e => e.schedule_id === scheduleId);
	// 	const sorted = filteredBySchedule.sort((a, b) => {
	// 		return Number(b.schedule_position) - Number(a.schedule_position)
	// 	});
	// }

	public createSchedule (): Observable<CreateScheduleRes> {
		const now = new Date();
		const payload = {
			name: now.toTimeString().slice(0, 5),
		}
	
		return this.http.post<CreateScheduleRes>(`${this.doroBaseUrl}/schedule/create`, payload)
	}

	public createFullSchedule (payload: CreateFullScheduleReq): Observable<CreateScheduleRes> {
	
		return this.http.post<CreateScheduleRes>(`${this.doroBaseUrl}/schedule/create-full`, payload)
	}

	private _loadSchedulesApi (): Observable<ScheduleListResDataItem[]> {
		
		return this.http.post<ScheduleListRes>(`${this.doroBaseUrl}/schedule/list`, null)
			.pipe(
				map(res => res.data), 
				catchError((err: any) => {
					throw new Error(err.message);
				}),
			)
	}

	public deleteSchedule (id: number) {
		const payload = {
			scheduleId: id
		}
		return this.http.post<any>(`${this.doroBaseUrl}/schedule/delete`, payload)
			.pipe(
				catchError((err: any) => {
					throw new Error(err.message);
				}),
			)
	}
}