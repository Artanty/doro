import { Injectable } from "@angular/core";
import { AppStateService } from "./app-state.service";
import { BusEvent } from "typlib";
import { Observable, of } from "rxjs";

@Injectable({ 
	providedIn: "root"
})
export class SetConfigHashAction {
	constructor(
		private _appStateService: AppStateService
	) {}
// no need to return
	public init(busEvent: BusEvent): void {

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
				this._appStateService.configHash.next(configHash);
			}
		}

		const configHashSchedules = res.config_hash_schedules;
		if (!configHashSchedules) {
			throw new Error(`no config_hash_schedules prop in response`);
		} else {
			if (typeof configHashSchedules !== 'number') {
				throw new Error(`config_hash_schedules is not a number`);
			} else {
				this._appStateService.configHashSchedules.next(configHashSchedules);
			}
		}

		
	}
}