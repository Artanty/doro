import { RouterModule } from "@angular/router";
import { CommonModule } from "@angular/common";
import { GuiDirective } from "../../components/_remote/web-component-wrapper/gui.directive";
import { TimerComponent } from "../../components/timer/timer.component";
import { TransitionEventComponent } from "./components/transition-event/transition-event.component";
import { BaseEventComponent } from "./components/base-event/base-event.component";
import { NgModule } from "@angular/core";
import { ScheduleRunComponent } from "./components/schedule-run/schedule-run.component";
import { LoadingComponent } from "../../components/loading/loading.component";
import { TransitionNextComponent } from "./components/transition-next/transition-next.component";

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
		TransitionNextComponent,
		BaseEventComponent
	],
	imports: [
		CommonModule,
		RouterModule.forChild(
			CHILD_ROUTES
		),
		GuiDirective,
		TimerComponent,
		LoadingComponent
	],
	exports: [RouterModule],
	providers: [],
})
export class ScheduleRunModule {
	constructor() {}

}