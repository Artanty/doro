import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { dd } from "../helpers/dd";
import { EventService } from "./event.service";
import { BASE_SCHEDULE_ID, DEFAULT_WORK_EVENT_LENGTH, EventProgress, eventTypes } from "../constants";
import { ScheduleService } from "./schedule.service";
import { AppStateService } from "./app-state.service";
import { ApiService } from "./api.service";
import { concatMap, filter, first, lastValueFrom, map, Observable, skip, take, tap } from "rxjs";
import { SuggestRestReq, SuggestRestRes } from "./api/schedule.types.api";
import { NextCalculatedEvent, NextSuggestionsRes } from "./next-event/next-event.types";
import { EventProps, EventStateReq } from "./event/event.types";
import { CreateEventReq } from "./api/event.types.api";
import { RouterService } from "./router.service";

export interface EventStateHook {
	"id": number
	"event_id": number
	"trigger_event_state_id": number // 3 - COMPLETE
	"action_type": string
	"action_config": {
		"scriptId": string
	},
	"created_at": string
	"updated_at": string
}
@Injectable()
export class NextEventService {
	constructor(
		private _router: Router,
		private _eventService: EventService,
		private _scheduleService: ScheduleService,
		private _state: AppStateService,
		private _api: ApiService,
		private _routerService: RouterService,
	) {}

	public onTransitionFound2(res: EventProps[]) {
		const transitionEvent = res[0];
		this._router.navigateByUrl(`doro/next-event/${transitionEvent.id}`);
	}

	public onTransitionFound(transitionId: number) {
		this._routerService.go(`doro/next-event/${transitionId}`);
	}

	public getEventByHook(hookId: number): EventProps | undefined {
		const allEvents = this._state.events.getValue();
		const foundParentEvent = allEvents.find(event => 
			event.state_hooks?.some(hook => hook.id === Number(hookId))
		);
		return foundParentEvent;
	}

	public getHookById(hookId: number): EventStateHook | undefined | any {
		return this.getEventByHook(hookId)?.state_hooks
			.find(hook => hook.id === Number(hookId));
	}

	public getCreatedFromEntity(transitionEvent: EventProps): EventStateHook | EventProps {
		let result: any
		const createdFromId = transitionEvent.created_from; // e_324 or h_123
		const entityType = createdFromId.split('_')[0];
		const entityId = Number(createdFromId.split('_')[1]);
		switch (entityType) {
			case 'h':
				result = this.getHookById(entityId);
				break;
			case 'e':
				result = this.getEvent(entityId);
				break;
			default:
				throw new Error(`Unknown entity type: ${entityType}`)
		}
		return result;
	}

	public async getNextActionSuggestions(transitionEventId: number): Promise<NextSuggestionsRes> {
		const transitionEvent = await lastValueFrom(this.listenEvent(transitionEventId));
		if (!transitionEvent) {
			throw new Error('no transition event found with id: ' + transitionEventId);
		}

		const createdFromId = transitionEvent.created_from; // e_324 or h_123
		const entityType = createdFromId.split('_')[0];
		const entityId = Number(createdFromId.split('_')[1]);
		if (entityType !== 'h') throw new Error(`Unknown entity type: ${entityType}`);
		const hook = this.getHookById(entityId);
		
		const isOnCompleteEvent = hook.trigger_event_state_id === EventProgress.COMPLETED;
		const isSuggestNext = hook.action_config?.scriptId === 'nextEvent';
		if (!isOnCompleteEvent || !isSuggestNext) throw new Error('unknown hook config');

		const creatorEvent = this.getEventByHook(hook.id);
		if (!creatorEvent) throw new Error('hook without parent - not implemented');
		const scheduleId = creatorEvent.schedule_id;
		if (!scheduleId) throw new Error('event without schedule - not implemented');

		const nextEventsBySchedule = this._scheduleService.getNextEventsOfSchedule(scheduleId, creatorEvent);
		/**
		 * Если у расписания нет следующего события
		 * Вычисляем его
		 * */
		let nextCalculatedEvent: NextCalculatedEvent = {
			type: eventTypes.WORK,
			length: 0,
			schedule_id: BASE_SCHEDULE_ID,
			schedule_position: 9999,
			debug: null,
		};
		if (nextEventsBySchedule.length < 1) {
			if (creatorEvent.type === eventTypes.REST) {
				// SUGGESTING WORK
				nextCalculatedEvent.type = eventTypes.WORK;
				// todo ask if schedule has settings. otherwise default
				nextCalculatedEvent.length = DEFAULT_WORK_EVENT_LENGTH;
			} else {
				// SUGGESTING REST
				nextCalculatedEvent.type = eventTypes.REST;
				const payload: SuggestRestReq = { scheduleId: creatorEvent.schedule_id }
				const suggestRestApiRes = await lastValueFrom(this._api.suggestRestApi(payload));
				nextCalculatedEvent.length = suggestRestApiRes.restDuration;
				nextCalculatedEvent.debug = { suggestRestApiRes };
			}
			nextCalculatedEvent.schedule_id = creatorEvent.schedule_id;
			nextCalculatedEvent.schedule_position = this._scheduleService.getNextPositionInSchedule(creatorEvent.schedule_id);
		}

		return {
			endedEvent: creatorEvent,
			nextEventsBySchedule,
			nextCalculatedEvent
		}
	}

	public getEvent(eventId: number): EventProps | undefined {
		const allEvents = this._state.events.getValue();
		const foundParentEvent = allEvents.find(event => event.id === eventId);
		return foundParentEvent;
	}

	// for race fix
	public listenEvent(eventId: number): Observable<EventProps | undefined> {
    
		return this._state.events.listenReq.pipe(
			filter(events => events.length > 0 && events.some(event => event.id === eventId)),
			map(events => events.find(event => event.id === eventId)),
			first() // Takes first emission that passes filter and completes
		);
	}

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

