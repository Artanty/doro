import { CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA } from "@angular/core";

import { RouterModule } from "@angular/router";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule, FormsModule } from "@angular/forms";
import { GuiDirective } from "../../components/_remote/web-component-wrapper/gui.directive";
import { SettingsComponent } from "./settings.component";

export const CHILD_ROUTES = [
	{
		path: '', 
		component: SettingsComponent,
	}
]
@NgModule({
	declarations: [
		SettingsComponent
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
})
export class SettingsModule {
	constructor() {}

}