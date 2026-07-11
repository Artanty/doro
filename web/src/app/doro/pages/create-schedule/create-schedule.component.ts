import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { ScheduleService } from "../../services/schedule/schedule.service";
import { dd } from "../../helpers/dd";
import { CreateFullScheduleReq, CreateScheduleRes } from "@contracts/schedule.contracts";

@Component({
	selector: 'app-create-schedule',
	templateUrl: './create-schedule.component.html',
	standalone: false,
})
export class CreateScheduleComponent implements OnInit {
	public isLoadingEmpty = false;
	public isLoadingFull = false;
	public scheduleConfig: CreateFullScheduleReq = {
		work: 25,
		rest: 5,
		bigRest: 15,
		bigRestStep: 4,
		cycles: 6,
	}
	
	public createdEmptyResult: null | string = null
	public createdFullResult: null | string = null

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
		this.isLoadingFull = true;
		this._scheduleService.createFullSchedule(this.scheduleConfig)
		.subscribe((res: CreateScheduleRes) => {
			this.isLoadingFull = false;
			this.createdFullResult = '/doro/schedule-run/' + res.data.scheduleId;
			this.cdr.detectChanges()
		})
	}

	onCreateEmptySchedule () {
		this.isLoadingEmpty = true;
		this._scheduleService.createSchedule().subscribe((res: CreateScheduleRes) => {
			this.isLoadingEmpty = false;
			this.createdEmptyResult = '/doro/event-list/' + res.data.scheduleId;
			this.cdr.detectChanges()
		})
	}
}
