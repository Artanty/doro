import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';

@Injectable()
export class SettingsService {
	constructor(
		private _storage: StorageService) {
	}

	public getAppMode(): boolean {
		return !!this._storage.get('appMode');
	}

	public isSheevaMode(): boolean {
		return this.getAppMode();
	}
}