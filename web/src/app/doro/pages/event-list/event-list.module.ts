import { NgModule } from "@angular/core";
import { EventListComponent } from "./components/event-list/event-list.component"
import { RouterModule } from "@angular/router";
import { CommonModule } from "@angular/common";
import { GuiDirective } from "../../components/_remote/web-component-wrapper/gui.directive";
import { EventListEventComponent } from "./components/event-list-event/event-list-event.component";

export const CHILD_ROUTES = [
	{
		path: '', 
		component: EventListComponent,
	},
	{
		path: ':id',
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
		GuiDirective
	],
	exports: [RouterModule],
	providers: [],
})
export class EventListModule {
	constructor() {}

}