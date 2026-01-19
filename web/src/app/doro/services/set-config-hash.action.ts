import { Injectable } from "@angular/core";
import { AppStateService } from "./app-state.service";
import { dd } from "../utilites/dd";
import { BusEvent } from "typlib";
import { Observable, of } from "rxjs";


@Injectable({ providedIn: "root" })
export class SetConfigHashAction {
	constructor(
		private _appStateService: AppStateService
	) {}

	public init(busEvent: BusEvent): Observable<boolean> {

		const res = busEvent.payload?.response?.body;
		if (!res) {
			throw new Error(`wrong busEvent payload, no response`);
		}
		if (res[`${process.env['THIS_BACK_PROJECT_ID']}`]) {
			const configHash = res[`${process.env['THIS_BACK_PROJECT_ID']}`]?.config_hash
			if (!configHash) {
				throw new Error(`no config_hash prop in ${process.env['THIS_BACK_PROJECT_ID']} response`);
			} else {
				if (typeof configHash !== 'number') {
					throw new Error(`config_hash is not a number`);
				} else {
					const result = this._appStateService.configHash.next(configHash);
					return of(result)
				}
			}
		} else {
			throw new Error(`no ${process.env['THIS_BACK_PROJECT_ID']} prop in response`);
		}
	}
}