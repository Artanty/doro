import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Inject,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { map } from 'rxjs';

const initialFormData = [
  {
    id: 1,
    eventName: 'Работа',
    eventType: 'work',
    eventLength: 25,
    visibility: true,
  },
  {
    id: 2,
    eventName: 'Отдых',
    eventType: 'rest',
    eventLength: 5,
    visibility: true,
  },
  {
    id: null,
    eventName: '',
    eventType: 'default',
    eventLength: 25,
    visibility: true,
  },
];
@Component({
  selector: 'app-form-array',
  templateUrl: './form-array.component.html',
  styleUrl: './form-array.component.scss',
})
export class FormArrayComponent implements OnInit {
  _formData: any[] = initialFormData;

  @Input() set formData(data: any[]) {
    if (data) {
      // this._formData = data
      this.setForm(data);
    }
  }

  @Output() arrayAway: EventEmitter<any> = new EventEmitter<any>();
  timersConfigForm: FormGroup;

  get timersConfigFa(): FormArray {
    return this.timersConfigForm.get('timersConfigFa') as FormArray;
  }

  constructor(
    @Inject(FormBuilder) private fb: FormBuilder,
    @Inject(ChangeDetectorRef) private cdr: ChangeDetectorRef
  ) {
    this.timersConfigForm = this.fb.group({
      timersConfigFa: this.fb.array([]),
    });
    this.timersConfigForm.valueChanges
      .pipe(
        map((res: any) => {
          return res.timersConfigFa.filter((el: any) => el.id);
        })
      )
      .subscribe((res) => {
        this.arrayAway.emit(res);
        // console.log(res.timersConfigFa)
      });
  }

  ngOnInit(): void {
    // this.setForm()
  }

  setForm(inputData?: any[]) {
    const data = inputData ?? this._formData;
    data.forEach((timerConfig) => {
      const timerConfigFg = this.fb.group({
        id: [timerConfig.id],
        eventName: [timerConfig.eventName],
        eventType: [timerConfig.eventType],
        eventLength: [timerConfig.eventLength],
        visibility: [timerConfig.visibility],
      });
      // (this.timersConfigForm.get('timersConfigFa') as FormArray)?.clear();
      (this.timersConfigForm.get('timersConfigFa') as FormArray)?.push(
        timerConfigFg
      );
      this.cdr.detectChanges();
    });
  }

  public setRowVisibility(index: number, newVal: boolean) {
    this.timersConfigFa.at(index)?.patchValue({ visibility: newVal });
    this.cdr.detectChanges();
  }

  public removeItem(index: number): void {
    this.timersConfigFa.removeAt(index);
  }
  public saveNewItem(index: number) {
    // this.timersConfigFa.at(index)?.patchValue({ id: newVal })
    const nextId =
      this.timersConfigFa.value
        ?.filter((el: any) => el.id)
        ?.map((el: any) => el.id)
        ?.sort((a: any, b: any) => b - a)?.[0] + 1 || 1;
    this.timersConfigFa.at(index)?.patchValue({ id: nextId });
    // console.log(nextId)
  }
}
