import { CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA } from "@angular/core";

import { RouterModule } from "@angular/router";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule, FormsModule } from "@angular/forms";
import { GuiDirective } from "../../components/_remote/web-component-wrapper/gui.directive";
import { ScheduleRunComponent } from "./schedule-run.component";
import { TimerComponent } from "../../components/timer/timer.component";
import { TransitionEventComponent } from "./components/transition-event/transition-event.component";
import { BaseEventComponent } from "./components/base-event/base-event.component";

export const CHILD_ROUTES = [
	{
		path: ':scheduleId', 
		component: ScheduleRunComponent,
	}
]
@NgModule({
	declarations: [
		ScheduleRunComponent,
		TransitionEventComponent,
		BaseEventComponent
	],
	imports: [
		CommonModule,
		RouterModule.forChild(
			CHILD_ROUTES
		),
		// ReactiveFormsModule,
		// FormsModule,
		GuiDirective,
		TimerComponent,
	],
	exports: [RouterModule],
	providers: [],
	// schemas: [NO_ERRORS_SCHEMA],
})
export class ScheduleRunModule {
	constructor() {}

}