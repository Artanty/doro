import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { GuiDirective } from "../../components/_remote/web-component-wrapper/gui.directive";
import { CreateEventComponent } from "./create-event.component";
import { FormsModule } from "@angular/forms";

export const CHILD_ROUTES = [
	{
		path: '', 
		component: CreateEventComponent,
	}
]
@NgModule({
	declarations: [
		CreateEventComponent
	],
	imports: [
		CommonModule,
		RouterModule.forChild(
			CHILD_ROUTES
		),
		// ReactiveFormsModule,
		FormsModule,
		GuiDirective
	],
	exports: [RouterModule],
	providers: [],
	// schemas: [NO_ERRORS_SCHEMA],
})
export class CreateEventModule {
	constructor() {}

}