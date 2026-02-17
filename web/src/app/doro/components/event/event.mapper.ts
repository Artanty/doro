import { Injectable } from "@angular/core";
import { AppStateService } from "../../services/app-state.service";
import { EventPropsDTO } from "./event.dto";
import { EventProps } from "./event.types";


@Injectable(
	// {
	//   providedIn: 'root'
	// }
)
export class EventMapperService {
	constructor(
		private _appStateService: AppStateService
	) {}

	public eventDtoToModel(eventPropsDTO: EventPropsDTO): EventProps {
		const { event_state_id, ...eventProps } = eventPropsDTO;
		
		const staticEventsState = this._appStateService.staticEventsState$.value;
		staticEventsState[eventProps.id] = event_state_id;
		this._appStateService.staticEventsState$.next(staticEventsState);

		return eventProps;
	}

}