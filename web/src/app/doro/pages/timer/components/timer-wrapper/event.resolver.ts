import { inject } from "@angular/core";
import { ResolveFn, ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";
import { switchMap, map } from "rxjs";
import { AppStateService } from "src/app/doro/services/app-state.service";
import { EventService } from "src/app/doro/services/event.service";
import { EventProps } from "src/app/doro/services/event.types";


export const eventResolver: ResolveFn<EventProps | undefined> = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  const eventService = inject(EventService);
  const stateService = inject(AppStateService);
  const eventId = route.paramMap.get('id')!;

  return eventService.loadEvents().pipe(
    switchMap(() => {
      return stateService.events.listen().pipe(
        map(res => {
          return res.find(event => event.id === Number(eventId))
        })
      );    
    })
  )
};