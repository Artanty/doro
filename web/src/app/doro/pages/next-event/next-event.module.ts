import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { GuiDirective } from "../../components/_remote/web-component-wrapper/gui.directive";

import { FormsModule } from "@angular/forms";
import { NextEventComponent } from "./next-event.component";

export const CHILD_ROUTES = [
	{
		path: ':transitionEventId', 
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

// {
//     "id": 21,
//     "created_at": "2026-03-16 08:30:35.000000",
//     "updated_at": "2026-03-16 08:30:35.000000",
//     "action_type": "script",
//     "action_config": {
//         "scriptId": "nextEvent"
//     },
//     "trigger_event_state_id": 3
// }