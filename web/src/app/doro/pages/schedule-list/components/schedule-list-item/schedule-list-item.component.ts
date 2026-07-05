import { Component, ChangeDetectionStrategy, Input, ChangeDetectorRef } from "@angular/core";
import { Router } from "@angular/router";
import { ScheduleListResDataItem } from "@contracts/schedule.contracts";
import { ScheduleService } from "@services/schedule/schedule.service";

@Component({
  selector: 'app-schedule-list-item',
  standalone: false,
  templateUrl: './schedule-list-item.component.html',
  styleUrl: './schedule-list-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScheduleListItemComponent {
  @Input() schedule!: ScheduleListResDataItem;

  menuItems = [
    { id: 'DELETE', name: 'Удалить' },
  ];

  constructor(
    private cdr: ChangeDetectorRef,
    private router: Router,
    private scheduleService: ScheduleService,
  ) {}

  goToSchedule() {
    this.router.navigateByUrl(`/doro/schedule-list/${this.schedule.id}`);
  }

  deleteSchedule() {
    this.scheduleService.deleteSchedule(this.schedule.id).subscribe();
  }
}
