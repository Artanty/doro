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
  ){
    this.counterConfigForm = this.fb.group({
      counterConfigFa: this.fb.array([])
    });
    this.counterConfigFa.valueChanges
      .pipe(
        debounceTime(2000),
        distinctUntilChanged((prev: any, next: any) => JSON.stringify(prev) === JSON.stringify(next))
      )
      .subscribe((res: any) => {
        console.log(res)
      })
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
      scheduleType: 'default'
    }]
    data.forEach(timerConfig => {
      const timerConfigFg = this.fb.group({
        scheduleName: [timerConfig.scheduleName],
        periodStart: [timerConfig.periodStart],
        periodEnd: [timerConfig.periodEnd],
        workLength: [timerConfig.workLength],
        restLength: [timerConfig.restLength],
        bigRestLength: [timerConfig.bigRestLength],
        bigRestRate: [timerConfig.bigRestRate],
        scheduleType: [timerConfig.scheduleType]
      });
      (this.counterConfigForm.get('counterConfigFa') as FormArray).clear();
      (this.counterConfigForm.get('counterConfigFa') as FormArray).push(timerConfigFg);
      this.cdr.detectChanges()
    })
  }

  handleCreate() {
    console.log('save')
  }
}
