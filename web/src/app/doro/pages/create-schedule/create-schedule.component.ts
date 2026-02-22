import { Component, EventEmitter, forwardRef, Input, OnInit, Output } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { dd } from 'src/app/doro/helpers/dd';

export interface CreateScheduleReq {
	work: number,
	rest: number,
	bigRest: number,
	bigRestStep: number,
	cycles: number,
}
@Component({
	selector: 'app-create-schedule',
	templateUrl: './create-schedule.component.html',
})
export class CreateScheduleComponent implements OnInit {
	public isLoading = false;
	public scheduleConfig: CreateScheduleReq = {
		work: 25,
		rest: 5,
		bigRest: 15,
		bigRestStep: 4,
		cycles: 3,
	}
	ngOnInit(): void {
		//
	}

	onWorkInputChange(data: any): void { this.scheduleConfig.work = data }
	onRestInputChange(data: any): void { this.scheduleConfig.rest = data }
	onBigRestInputChange(data: any): void { this.scheduleConfig.bigRest = data }
	onBigRestStepInputChange(data: any): void { this.scheduleConfig.bigRestStep = data }
	onCyclesInputChange(data: any): void { this.scheduleConfig.cycles = data }
    
	onSubmit(): void {
		console.log(this.scheduleConfig);
	}
}
