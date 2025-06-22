import {
  AfterViewInit,
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component,
  ElementRef, forwardRef, HostListener,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  FormControl,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR, NgModel, ValidationErrors,
  Validator
} from "@angular/forms";
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  finalize,
  fromEvent,
  map,
  mergeMap,
  Observable,
  takeUntil,
  tap,
  throttleTime
} from "rxjs";


@Component({
  selector: 'my-custom-element',
  template: `
<!--    <button (click)="trigger()">trigger</button>-->
<!--[style.height]="height+'px'"-->
    <div class="svg-item" [class.issetSuffix] = "issetSuffix"
         [style.width]="width+'px'"
         [style.height]="height+'px'"
         [style.font-size]="fontSize">
<!--      <input value="0"  wheelOn="integer" step="any" wheelDownNumber="1" wheelUpNumber="1">-->

      <svg width="100%" height="100%" viewBox="0 0 40 40" class="donut">
<!--        <circle class="donut-hole" cx="20" cy="20" r="15.91549430918954" fill="#fff"></circle>-->
        <circle class="donut-ring" cx="20" cy="20" r="15.91549430918954" fill="transparent" stroke-width="3.5"></circle>
        <circle class="donut-segment" attr.stroke="{{ color }}" cx="20" cy="20" r="15.91549430918954" fill="transparent" stroke-width="3.5" attr.stroke-dasharray="{{strokeDashArray}}" stroke-dashoffset="25"></circle>
        <g class="donut-text">

<!--          <text y="50%" transform="translate(0, 2)">-->
<!--            <tspan x="50%" text-anchor="middle" class="donut-percent">40%</tspan>-->
<!--          </text>-->
        </g>
      </svg>
      <div class="inputContainer" #svg>
<!--        attr.data-suffix="{{suffix}}"-->
        <div class="inputRow" >
          <input disabled *ngIf="!customValueView"
              [value]="_value"
               #visibleInput
               size="2"
               (input)="onInput($event)"
               draggable="false"
               class="donutInput noselect" [class.large]="!issetSuffix"
               id="donutInput"

          />
          <div *ngIf="customValueView"
          class="donutInput noselect"
          [style.font-size]="customValueViewFontSize"
          >{{ customValueView }}</div>
        </div>
      </div>
      <div class="title">{{title}}</div>
    </div>
    `,
  styleUrls: ['./my-custom-element.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi:true,
      useExisting: forwardRef(() => MyCustomElementComponent)
    },
    {
      provide: NG_VALIDATORS,
      multi: true,
      useExisting: forwardRef(() => MyCustomElementComponent)
    }
  ]
})
export class MyCustomElementComponent implements OnInit, AfterViewInit, OnDestroy, ControlValueAccessor, Validator {
  @ViewChild('visibleInput') visibleInput!: ElementRef<HTMLInputElement>;
  @ViewChild('svg') svg!: ElementRef;
  @Input() color: string = 'grey'
  strokeDashArray = '0 100'
  width: number = 100
  height: number = 100
  fontSize: string = '16px'
  @Input() suffix: string | number | null = '%'
  scale: number = 100
  @Input() step: number = 10
  @Input() title: string = ''
  @Input() readonly: boolean = false
  @Input() customValueView: string = ''
  @Input() customValueViewFontSize: any =  '1em'
  @Input() issetSuffix: boolean = false
  constructor(
      @Inject(ElementRef) private eRef: ElementRef,
      @Inject(ChangeDetectorRef) private cdr: ChangeDetectorRef
  ) {
  }

  // constructor(private host: ElementRef) {}
  @Input() ceilLimit: number = 100
  @Input() floorLimit: number = 0

  @Input() set size(value: number) {
    value = Number(value)
    this.width = value
    this.height = value
    if (this.issetSuffix) {

    } else {
      this.fontSize = Math.round(value / 3) + 'px'
    }
  }


  //get accessor
  get value(): any {
    return this._value;
  };

  //set accessor including call the onchange callback
  set value(v: any) {
    if (v !== this._value) {
      this._value = v;
      this.onChange(v);
    }
  }

  //new
  _value = 0;
  onChange = (quantity: any) => {
    console.log(quantity)
  };

  onTouched = () => {
  };

  touched = false;

  disabled = false;

  writeValue(value: number) { // called by the Forms module
    this._value = value;
    this.updateSVG(this._value)
  }

  registerOnChange(onChange: any) {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: any) {
    this.onTouched = onTouched;
  }

  markAsTouched() {
    if (!this.touched) {
      this.onTouched();
      this.touched = true;
    }
  }

  setDisabledState(disabled: boolean) {
    this.disabled = disabled;
  }

  validate(control: AbstractControl): ValidationErrors | null {
    const quantity = control.value;
    if (quantity <= 0) {
      return {
        mustBePositive: {
          quantity
        }
      };
    }
    return null //?
  }

  // new end
  returnPrevInputState(event: Event) {
    event.preventDefault()
    event.stopPropagation()
    this.visibleInput.nativeElement.value = String(this._value)
  }

  onInput(event: Event) {
    const value = Number((event.target as any).value)
    this.validateAndUpdate(value, event)
  }

  validateAndUpdate (value: number, event: Event) {
    console.log('val')
    if (typeof value === 'number' && !isNaN(value)) {
      let newValue = this.calculateNewValue(this._value, Math.round(value))
      newValue = (newValue < this.floorLimit) ? this.floorLimit : newValue
      newValue = (newValue > this.ceilLimit) ? this.ceilLimit : newValue
      if (this._value !== newValue) {
        if ((newValue === this.floorLimit) || (newValue === this.ceilLimit)){
          this._value = newValue
          this.onChange(this._value)
          this.updateSVG(this._value)
          this.cdr.detectChanges()
        }
      }
    } else {
      this.returnPrevInputState(event)
    }
  }

  connectedCallback() {
    console.log('Custom element connected to the DOM');
  }

  disconnectedCallback() {
    console.log('Custom element disconnected from the DOM');
  }

  attributeChangedCallback(name: string, oldValue: any, newValue: any) {
    console.log(`Attribute ${name} changed from ${oldValue} to ${newValue}`);
  }

  ngOnInit() {
  }

  ngAfterViewInit() {
    if (!this.readonly) {
      const elem = this.svg?.nativeElement
      const wheel$ = fromEvent<WheelEvent>(elem, 'wheel')
      wheel$.subscribe(e => {
        const modifier = e.deltaY > 0 ? this.step : -(this.step)
        let newValue = this._value + modifier
        newValue = (newValue < this.floorLimit) ? this.floorLimit : newValue
        newValue = (newValue > this.ceilLimit) ? this.ceilLimit : newValue
        this._value = newValue
        this.onChange(this._value)
        this.updateSVG(this._value)
        this.cdr.detectChanges()
      })
    }
  }

  ngOnDestroy() {
    // console.log('Custom element destroyed');
  }

  updateSVG(value: number) {
    this.strokeDashArray = value + ' ' + (100 - value)
    this.cdr.detectChanges()
  }
  trigger(){
    this.strokeDashArray = '30 70'
  }

  calculateNewValue (oldValue: number, modifier: number) {
    return oldValue + modifier
  }
}
