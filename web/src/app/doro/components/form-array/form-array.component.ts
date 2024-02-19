import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Inject,
  OnInit,
  Output
} from '@angular/core';
import {AudioComponent} from "../../../audio/audio.component";
import {DoroModule} from "../../doro.module";
import {NgForOf} from "@angular/common";
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule
} from "@angular/forms";
import {debounceTime} from "rxjs";

@Component({
  selector: 'app-form-array',
  templateUrl: './form-array.component.html',
  styleUrl: './form-array.component.scss'
})
export class FormArrayComponent implements OnInit{
  @Output() arrayAway: EventEmitter<any> = new EventEmitter<any>()
  timersConfigForm: FormGroup;

  get timersConfigFa(): FormArray {
    return this.timersConfigForm.get('timersConfigFa') as FormArray;
  }

  constructor(
    @Inject(FormBuilder) private fb: FormBuilder,
    @Inject(ChangeDetectorRef) private cdr: ChangeDetectorRef,
  ) {
    this.timersConfigForm = this.fb.group({
      timersConfigFa: this.fb.array([])
    });
    this.timersConfigForm.valueChanges
      .pipe(debounceTime(300))
      .subscribe(res => {
        this.arrayAway.emit(res.timersConfigFa)
        // console.log(res.timersConfigFa)
    })
  }

  ngOnInit():void {
    this.setForm()
  }

  setForm () {
    const data = [
      {
        eventConfigId: 1,
        eventName: 'Работа',
        eventType: 'work',
        eventLength: 25,
        visibility: true
      },
      {
        eventConfigId: 2,
        eventName: 'Отдых',
        eventType: 'rest',
        eventLength: 5,
        visibility: true
      }
    ]
    data.forEach(timerConfig => {
      const timerConfigFg = this.fb.group({
        eventConfigId: [timerConfig.eventConfigId],
        eventName: [timerConfig.eventName],
        eventType: [timerConfig.eventType],
        eventLength: [timerConfig.eventLength],
        visibility: [timerConfig.visibility]
      });
      // (this.timersConfigForm.get('timersConfigFa') as FormArray)?.clear();
      (this.timersConfigForm.get('timersConfigFa') as FormArray)?.push(timerConfigFg);
      this.cdr.detectChanges()
    })
  }

  public setRowVisibility (index: number, newVal: boolean) {
    this.timersConfigFa.at(index)?.patchValue({visibility: newVal })
    this.cdr.detectChanges()
  }

  public removeItem(index: number): void {
    this.timersConfigFa.removeAt(index);
  }
}
