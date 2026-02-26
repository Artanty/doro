import { CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA } from "@angular/core";

import { RouterModule } from "@angular/router";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule, FormsModule } from "@angular/forms";
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
		// ReactiveFormsModule,
		// FormsModule,
		GuiDirective
	],
	exports: [RouterModule],
	providers: [],
	// schemas: [NO_ERRORS_SCHEMA],
})
export class ScheduleListModule {
	constructor() {}

}