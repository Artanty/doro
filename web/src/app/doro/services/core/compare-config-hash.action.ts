import { Injectable } from "@angular/core";
import { AppStateService } from "./app-state.service";
import { BusEvent } from "typlib";
import { dd } from "@helpers/dd";

@Injectable({ providedIn: "root" })

//todo rename to isNeedRefresh
export class CompareConfigHashAction {
	constructor(
		private _appStateService: AppStateService
	) {}
	
	private prevTupleEvents = [0, 0];
	private prevTupleSchedules = [0, 0];

	public init(tikConfigHashEntry: { 
		id: string, // h_1 - events; h_2 - schedules
		cur: number 
	} | null): boolean {
		
		let result;
		const newConfigHash = tikConfigHashEntry?.cur;
		if (!newConfigHash) {
			throw new Error(`wrong tikConfigHashEntry, no cur prop`);
		}
		const hashId = tikConfigHashEntry.id;
		let currentValue = 0;
		
		switch (hashId) {
			case 'h_1':
				currentValue = this._appStateService.configHash.getValue();
				const valuesTuple1 = [
					currentValue, 
					newConfigHash
				];

				if (JSON.stringify(this.prevTupleEvents) === JSON.stringify(valuesTuple1)) {
					// dd('events hash: values not changed');
					result = false;
				} else {
					result = currentValue !== newConfigHash;
				}
				this.prevTupleEvents = valuesTuple1
				// dd('events hash: isNeed refresh: ' + result)			
				
				break;
			case 'h_2':
				currentValue = this._appStateService.configHashSchedules.getValue();
				const valuesTuple2 = [
					currentValue, 
					newConfigHash
				];

				if (JSON.stringify(this.prevTupleSchedules) === JSON.stringify(valuesTuple2)) {
					// dd('schedules hash: values not changed');
					result = false;
				} else {
					result = currentValue !== newConfigHash;
				}
				this.prevTupleSchedules = valuesTuple2
				// dd('schedules hash: isNeed refresh: ' + result)

				break;
			default:
				throw new Error(`hash id ${hashId} not implemented`);
		}

		return result;
	
	}
}