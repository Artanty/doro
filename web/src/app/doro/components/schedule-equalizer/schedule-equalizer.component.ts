import {
  ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges
} from '@angular/core';
import { GetEventResDataItem } from '@contracts/event.contract';
import { CommonModule } from '@angular/common';

const BAR_WIDTH = 14;
const BAR_GAP = 3;

@Component({
  selector: 'app-schedule-equalizer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './schedule-equalizer.component.html',
  styleUrl: './schedule-equalizer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleEqualizerComponent implements OnChanges {
  @Input() events: GetEventResDataItem[] = [];
  @Input() activeEventId: number | null = null;
  @Input() containerWidth: number = 200;
  @Input() upsideDown: boolean = false;

  trackWidth = 0;
  offsetX = 0;

  private maxLength = 0;

  ngOnChanges() {
    if (this.events.length) {
      this.maxLength = Math.max(...this.events.map(e => e.length));
    }
    this.calcOffset();
  }

  getBarHeight(length: number): number {
    if (!this.maxLength) return 10;
    return 8 + (length / this.maxLength) * 28;
  }

  private calcOffset() {
    this.trackWidth = this.events.length * (BAR_WIDTH + BAR_GAP) - BAR_GAP;

    if (!this.events.length || this.activeEventId == null) {
      this.offsetX = this.trackWidth <= this.containerWidth
        ? (this.containerWidth - this.trackWidth) / 2
        : 0;
      return;
    }

    const idx = this.events.findIndex(e => e.id === this.activeEventId);
    if (idx < 0) {
      this.offsetX = this.trackWidth <= this.containerWidth
        ? (this.containerWidth - this.trackWidth) / 2
        : 0;
      return;
    }

    // If all bars fit, center the whole track
    if (this.trackWidth <= this.containerWidth) {
      this.offsetX = (this.containerWidth - this.trackWidth) / 2;
      return;
    }

    // Scroll to center active bar
    const centerOfActive = idx * (BAR_WIDTH + BAR_GAP) + BAR_WIDTH / 2;
    let offset = this.containerWidth / 2 - centerOfActive;

    const maxOffset = 0;
    const minOffset = this.containerWidth - this.trackWidth;
    this.offsetX = Math.max(minOffset, Math.min(maxOffset, offset));
  }
}
