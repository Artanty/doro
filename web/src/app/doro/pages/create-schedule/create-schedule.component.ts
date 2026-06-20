import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { ScheduleService } from "../../services/schedule/schedule.service";
import { dd } from "../../helpers/dd";

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
	standalone: false,
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
	
	public createdEmptyResult: null | string = null

	constructor (
		private _scheduleService: ScheduleService,
		 private cdr: ChangeDetectorRef,
	) {}

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

	onCreateEmptySchedule () {
		this.isLoading = true;
		this._scheduleService.createSchedule().subscribe(res => {
			dd(res);
			this.isLoading = false;
			this.createdEmptyResult = '/doro/event-list/' + res.data;
			this.cdr.detectChanges()
		})
	}
}
