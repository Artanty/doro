import { Injectable } from "@angular/core";
import { AppStateService } from "./app-state.service";
import { dd } from "../utilites/dd";
import { BusEvent } from "typlib";
import { Observable, of } from "rxjs";


@Injectable({ 
	providedIn: "root"
})
export class SetConfigHashAction {
	constructor(
		private _appStateService: AppStateService
	) {}

	public init(busEvent: BusEvent): Observable<boolean> {

		const res = busEvent.payload?.response?.body;
		if (!res) {
			throw new Error(`wrong busEvent payload, no response`);
		}
		const configHash = res.config_hash;
		if (!configHash) {
			throw new Error(`no config_hash prop in response`);
		} else {
			if (typeof configHash !== 'number') {
				throw new Error(`config_hash is not a number`);
			} else {
				const result = this._appStateService.configHash.next(configHash);
				return of(result)
			}
		}
	}
}