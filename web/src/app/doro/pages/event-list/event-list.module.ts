import { CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { EventListComponent } from "./components/event-list/event-list.component"
import { RouterModule } from "@angular/router";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule, FormsModule } from "@angular/forms";
import { GuiDirective } from "../../components/_remote/web-component-wrapper/gui.directive";
import { EventListEventComponent } from "./components/event-list-event/event-list-event.component";

export const CHILD_ROUTES = [
	{
		path: '', 
		component: EventListComponent,
	}
]
@NgModule({
	declarations: [
		EventListComponent,
		EventListEventComponent
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
export class EventListModule {
	constructor() {}

}