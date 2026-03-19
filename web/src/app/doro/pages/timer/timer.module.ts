import { CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { RouterModule } from "@angular/router";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule, FormsModule } from "@angular/forms";
import { GuiDirective } from "../../components/_remote/web-component-wrapper/gui.directive";
import { TimerWrapperComponent } from "./components/timer-wrapper/timer-wrapper.component";
import { eventResolver } from "./components/timer-wrapper/event.resolver";
import { TimerComponent } from "../../components/timer/timer.component";

export const CHILD_ROUTES = [
	{
		path: ':id', 
		component: TimerWrapperComponent,
		// resolve: {
		// 	event: eventResolver
		// }
	}
]
@NgModule({
	declarations: [
		
		TimerWrapperComponent
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
export class TimerModule {
	constructor() {}

}