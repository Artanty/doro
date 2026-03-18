import { Component, EventEmitter, forwardRef, Input, OnInit, Output } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { dd } from 'src/app/doro/helpers/dd';
import { StorageService } from '../../services/storage.service';

export interface Settings {
	appMode: boolean
}
@Component({
	selector: 'app-settings',
	templateUrl: './settings.component.html',
	standalone: false,
})
export class SettingsComponent implements OnInit {
	public isLoading = false;

	public settings: Settings = {
		appMode: false
	}

	constructor(
		private _storage: StorageService) {}

	ngOnInit(): void {
		this.settings.appMode = this._storage.get('appMode')!;
		dd(this.settings)
	}

	onAppModeChange(data: boolean): void { 
		this.settings.appMode = data;
		this._storage.set('appMode', data)
	}
}
