import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { GuiDirective } from "../../components/_remote/web-component-wrapper/gui.directive";
import { ScheduleListComponent } from "./schedule-list.component";

export const CHILD_ROUTES = [
	{
		path: '', 
		component: ScheduleListComponent,
	}
]
@NgModule({
	declarations: [
		ScheduleListComponent
	],
	imports: [
		CommonModule,
		RouterModule.forChild(
			CHILD_ROUTES
		),
		GuiDirective
	],
	exports: [RouterModule],
	providers: [],
})
export class ScheduleListModule {
	constructor() {}

}