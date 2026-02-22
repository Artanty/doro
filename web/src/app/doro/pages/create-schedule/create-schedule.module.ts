import { CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { CreateScheduleComponent } from "./create-schedule.component";
import { RouterModule } from "@angular/router";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule, FormsModule } from "@angular/forms";

export const CHILD_ROUTES = [
	{
		path: '', 
		component: CreateScheduleComponent,
	}
]
@NgModule({
	declarations: [
		CreateScheduleComponent
	],
	imports: [
		CommonModule,
		RouterModule.forChild(
			CHILD_ROUTES
		),
		ReactiveFormsModule,
		FormsModule,
	],
	exports: [RouterModule],
	providers: [],
	schemas: [NO_ERRORS_SCHEMA],
})
export class CreateScheduleModule {
	constructor() {}

}