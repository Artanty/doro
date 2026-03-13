import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { GuiDirective } from "../../components/_remote/web-component-wrapper/gui.directive";

import { FormsModule } from "@angular/forms";
import { NextEventComponent } from "./next-event.component";

export const CHILD_ROUTES = [
	{
		path: '', 
		component: NextEventComponent,
	}
]
@NgModule({
	declarations: [
		NextEventComponent
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
export class NextEventModule {
	constructor() {}

}