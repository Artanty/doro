import { Injectable } from "@angular/core";
import { AppStateService } from "./app-state.service";
import { dd } from "../utilites/dd";
import { BusEvent } from "typlib";

@Injectable({ providedIn: "root" })

//todo rename to isNeedRefresh
export class CompareConfigHashAction {
	constructor(
		private _appStateService: AppStateService
	) {}

	private prevValues = [0, 0];

	public init(tikConfigHashEntry: { id: string, cur: number } | null): boolean {
		let result;
		const newConfigHash = tikConfigHashEntry?.cur;
		if (!newConfigHash) {
			throw new Error(`wrong tikConfigHashEntry, no cur prop`);
		}
		// dd(this._appStateService.configHash.value)
		// dd(newConfigHash)

		const valuesTuple = [
			this._appStateService.configHash.value, 
			newConfigHash
		];

		if (JSON.stringify(this.prevValues) === JSON.stringify(valuesTuple)) {
			// dd('values not changed');
			result = false;
		} else {
			result = this._appStateService.configHash.value !== newConfigHash;
		}
		this.prevValues = valuesTuple

		return result;
	}
}
