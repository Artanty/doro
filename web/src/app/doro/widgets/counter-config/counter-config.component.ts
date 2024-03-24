import {
  ChangeDetectorRef,
  Component,
  Inject,
  OnInit
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup
} from "@angular/forms";
import {
  debounceTime,
  distinctUntilChanged
} from "rxjs";
import {CounterConfigService, IWorkSimpleCounterConfig} from "../../services/counter-config.service";
import { ScheduleEventService } from '../../services/schedule-event.service';
import { StoreService } from '../../services/store.service';

export interface ICounterPeriodConfig {
  bigRestLength: number;
  bigRestRate: number;
  periodEnd: string;
  periodStart: string;
  restLength: number;
  scheduleName: string;
  scheduleType: string;
  workLength: number;
  workName: string
  restName: string
}
export interface ICounterConfigForm {
  counterConfigFa: ICounterPeriodConfig[]
}

@Component({
  selector: 'app-counter-config',
  templateUrl: './counter-config.component.html',
  styleUrl: './counter-config.component.scss'
})
export class CounterConfigComponent implements OnInit {
  counterConfigForm: FormGroup;
  get counterConfigFa(): FormArray {
    return this.counterConfigForm.get('counterConfigFa') as FormArray;
  }

  constructor(
    @Inject(FormBuilder) private fb: FormBuilder,
    @Inject(ChangeDetectorRef) private cdr: ChangeDetectorRef,
    @Inject(CounterConfigService) private CounterConfigServ: CounterConfigService,
    @Inject(ScheduleEventService) private ScheduleEventServ: ScheduleEventService,
    @Inject(StoreService) private StoreServ: StoreService
  ){
    this.counterConfigForm = this.fb.group({
      counterConfigFa: this.fb.array([])
    });
  }
  ngOnInit (): void {
    const data = [{
      scheduleName: 'Расписание по умолчанию',
      periodStart: '10:00',
      periodEnd: '18:30',
      workLength: 25,
      restLength: 5,
      bigRestLength: 15,
      bigRestRate: 3,
      scheduleType: 'default',
      workName: 'Работа',
      restName: 'Отдых',
    }]
    data.forEach((timerConfig: ICounterPeriodConfig) => {
      const timerConfigFg = this.fb.group({
        scheduleName: [timerConfig.scheduleName],
        periodStart: [timerConfig.periodStart],
        periodEnd: [timerConfig.periodEnd],
        workLength: [timerConfig.workLength],
        restLength: [timerConfig.restLength],
        bigRestLength: [timerConfig.bigRestLength],
        bigRestRate: [timerConfig.bigRestRate],
        scheduleType: [timerConfig.scheduleType],
        workName: [timerConfig.workName],
        restName: [timerConfig.restName]
      });
      (this.counterConfigForm.get('counterConfigFa') as FormArray).clear();
      (this.counterConfigForm.get('counterConfigFa') as FormArray).push(timerConfigFg);
      this.cdr.detectChanges()
    })
  }

  handleCreate() {
    const formResult: ICounterConfigForm = this.counterConfigForm.getRawValue()
    this.ScheduleEventServ.createScheduleWithEvents({
      schedule: this.CounterConfigServ.getScheduleFromConfig(formResult.counterConfigFa[0]),
      events: this.CounterConfigServ.getEventsFromConfig(formResult.counterConfigFa[0]),
      scheduleConfigId: this.StoreServ.getScheduleConfig()?.id as number
    }).subscribe()
  }

}
