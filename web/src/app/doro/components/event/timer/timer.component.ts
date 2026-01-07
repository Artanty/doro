import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { countPrc } from '../utils';
import { eventTypes } from '../../../constants';
import { dd } from 'src/app/doro/helpers/dd';

@Component({
  selector: 'app-timer',
  standalone: false,
  // imports: [],
  templateUrl: './timer.component.html',
  styleUrl: './timer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimerComponent implements OnChanges {
  @Input() time: number = 0;
  @Input() length: number = 0;
  @Input() eventType: number = 0; // work = 2, rest = 3;
  @Input() scheduleProgress: [number, number] = [2, 4];
  @Output() percentageChange = new EventEmitter<number>();

  public percentage: number = 0;
  public timeLeft: number = 0
  public eventTypes = eventTypes;
  public scheduleEvents: number[] = [1, 1, 1, 1];
  // Constants
  private readonly radius = 100;
  private readonly circumference = 2 * Math.PI * this.radius; // ≈ 628.32
  private readonly center = 103;

  ngOnInit(): void {
    this._buildScheduleEvents();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['time'] || changes['length']) {
      this.percentage = countPrc(this.length, this.time);
      this.timeLeft = this.length - this.time;
    }
    if (changes['scheduleProgress']) {
      this._buildScheduleEvents();
    }
  }

  private _buildScheduleEvents() {
    const all: unknown[] = Array(this.scheduleProgress[1]).fill(0)
    const done = this.scheduleProgress[0];
    this.scheduleEvents = all.map((_, i: number) => {
      // el - each evnt in schedule
      // 1 = done, 0 - undone;
      return i < done ? 1 : 0;
    })
  }

  // Calculate stroke-dasharray value
  getDashArray(): string {
    const dashLength = (this.percentage / 100) * this.circumference;
    const gapLength = this.circumference - dashLength;
    return `${dashLength.toFixed(2)}, ${gapLength.toFixed(2)}`;
  }

  // Get SVG transform attribute - rotate to start from top
  getTransform(): string {
    return `rotate(-90 ${this.center} ${this.center})`;
  }

  // Set percentage value
  setPercentage(value: number): void {
    this.percentage = Math.min(100, Math.max(0, value));
    this.percentageChange.emit(this.percentage);
  }

  // Handle slider change
  onSliderChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.setPercentage(parseInt(input.value, 10));
  }

  // Get current dash and gap values for display
  getCurrentValues(): { dash: number; gap: number } {
    const dashLength = (this.percentage / 100) * this.circumference;
    const gapLength = this.circumference - dashLength;
    return {
      dash: parseFloat(dashLength.toFixed(2)),
      gap: parseFloat(gapLength.toFixed(2)),
    };
  }
}
