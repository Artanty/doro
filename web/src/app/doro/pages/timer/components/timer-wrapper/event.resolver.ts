import { inject } from "@angular/core";
import { ResolveFn, ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";
import { switchMap, map, of } from "rxjs";
import { AppStateService } from "src/app/doro/services/app-state.service";
import { EventService } from "src/app/doro/services/event.service";
import { EventProps } from "src/app/doro/services/event/event.types";

export const eventResolver: ResolveFn<EventProps | undefined> = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  const eventService = inject(EventService);
  const stateService = inject(AppStateService);
  const eventId = route.paramMap.get('id')!;

  const events = stateService.events.getValue();
  if (events.length > 0) {
    const found = events.find(event => event.id === Number(eventId));
    return of(found)
  } else {
    return eventService.loadEvents().pipe(
      switchMap(() => {
        return stateService.events.listen().pipe(
          map(res => {
            return res.find(event => event.id === Number(eventId))
          })
        );    
      })
    )
  }
};