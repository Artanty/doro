import { RouterModule } from "@angular/router";
import { CommonModule } from "@angular/common";
import { GuiDirective } from "../../components/_remote/web-component-wrapper/gui.directive";
import { SettingsComponent } from "./settings.component";
import { NgModule } from "@angular/core";

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