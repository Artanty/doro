import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-timer',
  standalone: false,
  // imports: [],
  templateUrl: './timer.component.html',
  styleUrl: './timer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimerComponent implements OnChanges {
  @Input() percentage: number = 0;
  @Output() percentageChange = new EventEmitter<number>();

  // Constants
  private readonly radius = 100;
  private readonly circumference = 2 * Math.PI * this.radius; // ≈ 628.32
  private readonly center = 103;

 

  ngOnChanges(changes: SimpleChanges) {
    if (changes['percentage']) {
      // You can add any side effects here when percentage changes
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
