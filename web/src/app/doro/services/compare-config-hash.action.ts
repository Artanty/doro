import { Injectable } from "@angular/core";
import { AppStateService } from "./app-state.service";
import { dd } from "../utilites/dd";
import { BusEvent } from "typlib";

@Injectable({ providedIn: "root" })
export class CompareConfigHashAction {
	constructor(
		private _appStateService: AppStateService
	) {}

	public init(tikConfigHashEntry: { id: string, cur: number } | null): boolean {

		const newConfigHash = tikConfigHashEntry?.cur;
		if (!newConfigHash) {
			throw new Error(`wrong tikConfigHashEntry, no cur prop`);
		}
		return this._appStateService.configHash.value === newConfigHash;
	}
}