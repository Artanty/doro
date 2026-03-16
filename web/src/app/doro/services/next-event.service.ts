import { Injectable } from "@angular/core";
import { EventProps } from "./event.types";
import { Router } from "@angular/router";
import { dd } from "../helpers/dd";
import { EventService } from "./event.service";

@Injectable()
export class NextEventService {
	constructor(
		private _router: Router,
		private _eventService: EventService
	) {}
	/**
	 * появился ивент перехода - роутим на компонент.
	 * */
	public onTransitionFound(res: EventProps[]) {
		const transitionEvent = res[0];
		this._router.navigateByUrl(`doro/next-event/${transitionEvent.id}`);
	}

	public findParentEvent(transitionEventId: number): EventProps | undefined {
		const allEvents = this._eventService.events$.getValue();
		const foundParentEvent = allEvents.find(event => 
			event.state_hooks?.some(hook => hook.id === Number(transitionEventId))
		);
		return foundParentEvent;
	}

	/**
	 * todo
	 * Сделать апи типа getRecentEventOrSchedule()
	 * проверить сначала наличие schedule
	 * потом аналогично getRecentEventOrSchedule()
	 * подумать, мб не нужен запрос ведь все данные актуальны (согласно хэшу)
	 * */
}