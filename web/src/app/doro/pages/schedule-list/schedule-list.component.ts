import { Component } from "@angular/core";
import { Observable, tap } from "rxjs";
import { ScheduleListResDataItem } from "@contracts/schedule.contracts";
import { AppStateService } from "@services/core/app-state.service";
import { dd } from "@helpers/dd";

@Component({
  selector: 'app-schedule-list',
  standalone: false,
  templateUrl: './schedule-list.component.html',
  styleUrl: './schedule-list.component.scss'
})
export class ScheduleListComponent {
  public schedules$: Observable<ScheduleListResDataItem[]>;

  constructor(
    private _state: AppStateService,
  ) {
    this.schedules$ = this._state.schedules.listen().pipe(tap(res => dd(res)));
  }
}
