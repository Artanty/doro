import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { GuiDirective } from "../../components/_remote/web-component-wrapper/gui.directive";
import { CreateScheduleComponent } from "./create-schedule.component";


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
		GuiDirective
	],
	exports: [RouterModule],
	providers: [],
})
export class CreateScheduleModule {
	constructor() {}

}