import { Injectable } from "@angular/core"
import { Observable, concatMap, tap } from "rxjs"
import { ApiService } from "../api.service";
import { CreateEventReq } from "../api/event.types.api";
import { AppStateService } from "../app-state.service";
import { EventStateReq } from "../event/event.types";


@Injectable()
export class NextEventService {
	
	constructor(
		private _state: AppStateService,
		private _api: ApiService,
	) {}

	public finishTransitionAndStartNextEvent(idToFinish: number, idToPlay: number): Observable<any> {
		const payload: EventStateReq = {
			eventStates: [
				{
					"eventId": idToFinish, 
					"state": 3
				},
				{
					"eventId": idToPlay, 
					"state": 1
				}
			]
		};
		return this._api.setEventStateApi(payload);
	}

	public finishTransitionAndCreateNextEvent(idToFinish: number, eventToCreate: CreateEventReq): Observable<any> {
		const payload: EventStateReq = {
			eventStates: [
				{
					"eventId": idToFinish, 
					"state": 3
				},
			]
		};
		return this._api.setEventStateApi(payload).pipe(
			concatMap(() => {
				return this._api.createEventApi(eventToCreate);
			}),
			tap(() => {
				this._state.configHash.next(999);
			})
		);
	}

	public finishTransitionAndPlayDuplicatedEvent(idToFinish: number, idToDuplicate: number): Observable<any> {
		const payload: EventStateReq = {
			eventStates: [
				{
					"eventId": idToFinish, 
					"state": 3
				},
			]
		};
		return this._api.setEventStateApi(payload).pipe(
			concatMap(() => {
				return this._api.playEventApi({ eventId: idToDuplicate }).pipe(tap(() => {
					this._state.configHash.next(999);
				}));
			}),
			tap(() => {
				this._state.configHash.next(999);
			})
		);
	}
}

export interface NextScheduleInfo {
	schedule_id: number | null,
	schedule_position: number | null		
}

