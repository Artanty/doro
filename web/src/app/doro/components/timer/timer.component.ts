import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { eventTypes } from '../../constants';
import { countPrc } from '@helpers/count-percent.util';
import { CommonModule } from "@angular/common";

@Component({
  selector: 'app-timer',
  standalone: true,
  imports: [
    CommonModule,
  ],
  templateUrl: './timer.component.html',
  styleUrl: './timer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimerComponent implements OnChanges {
  Number = Number;
  @Input() time: number = 0;
  @Input() length: number = 0;
  @Input() eventType: number = 0; // work = 1, rest = 2;
  @Input() scheduleProgress: number[] = [];
  @Input() maxWidth: number = 240;

  public percentage: number = 0;
  public timeLeft: number = 0
  public eventTypes = eventTypes;
  // Constants
  private readonly radius = 94;
  private readonly circumference = 2 * Math.PI * this.radius; // ≈ 590.62
  private readonly center = 103;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['time'] || changes['length']) {
      this.percentage = countPrc(this.length, this.time);
      this.timeLeft = this.length - this.time;
    }
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
}
