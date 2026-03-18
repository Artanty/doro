import { Injectable } from "@angular/core";
import { EventProps, EventStateReq } from "./event.types";
import { Router } from "@angular/router";
import { dd } from "../helpers/dd";
import { EventService } from "./event.service";
import { BASE_SCHEDULE_ID, EventProgress, eventTypes } from "../constants";
import { ScheduleService } from "./schedule.service";
import { AppStateService } from "./app-state.service";
import { ApiService } from "./api.service";
import { lastValueFrom, Observable } from "rxjs";
import { SuggestRestReq } from "./api/schedule.types.api";
import { NextCalculatedEvent, NextSuggestionsRes } from "./next-event/next-event.types";

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
		private _api: ApiService
	) {}

	public onTransitionFound(res: EventProps[]) {
		const transitionEvent = res[0];
		this._router.navigateByUrl(`doro/next-event/${transitionEvent.id}`);
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



	/**
	 * todo
	 * Сделать апи типа getRecentEventOrSchedule()
	 * проверить сначала наличие schedule
	 * потом аналогично getRecentEventOrSchedule()
	 * подумать, мб не нужен запрос ведь все данные актуальны (согласно хэшу)
	 * */



	// const foundParentEvent = nextEventService.findParentEvent(+transitionEventId);


	/**
	 * задача - сформировать объект со всеми возможными вариантами
	 * 
	 * */
	public async getNextActionSuggestions(transitionEventId: number): Promise<NextSuggestionsRes> {
		const transitionEvent = this.getEvent(transitionEventId);
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
			data: null,
			schedule_id: BASE_SCHEDULE_ID,
			schedule_position: 9999
		};
		if (nextEventsBySchedule.length < 1) {
			if (creatorEvent.type === eventTypes.REST) {
				// SUGGESTING WORK
				nextCalculatedEvent.type = eventTypes.WORK;
			} else {
				// SUGGESTING REST
				nextCalculatedEvent.type = eventTypes.REST;
				const payload: SuggestRestReq = { scheduleId: creatorEvent.schedule_id }
				nextCalculatedEvent.data = await lastValueFrom(this._api.suggestRestApi(payload));
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
}

export interface NextScheduleInfo {
	schedule_id: number | null,
	schedule_position: number | null		
}

