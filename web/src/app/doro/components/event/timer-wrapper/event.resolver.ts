import { inject } from "@angular/core";
import { ResolveFn, ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";
import { switchMap, map } from "rxjs";
import { EventProps } from "../event.types";
import { EventService } from "../event.service";

export const eventResolver: ResolveFn<EventProps | undefined> = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  const eventService = inject(EventService);
  const eventId = route.paramMap.get('id')!;

  return eventService.loadEvents().pipe(
    switchMap(() => {
      return eventService.listenEvents().pipe(
        map(res => {
          return res.find(event => event.id === Number(eventId))
        })
      );    
    })
  )
};