import { Injectable } from "@angular/core";
import { EventProps } from "./event.types";
import { Router } from "@angular/router";
import { dd } from "../helpers/dd";

@Injectable({
	providedIn: 'root'
})
export class NextEventService {
	constructor(
		private _router: Router
	) {}
	/**
	 * появился ивент перехода - роутим на компонент.
	 * */
	public onTransitionFound(res: EventProps[]) {
		const transitionEvent = res[0];
		this._router.navigateByUrl(`doro/next-event/${transitionEvent.id}`);
	}
}