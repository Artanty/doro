import { inject } from "@angular/core";
import { ResolveFn, ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";
import { EMPTY, of } from "rxjs";
import { EventService } from "src/app/doro/services/event.service";
import { EventProps } from "src/app/doro/services/event.types";
import { NextEventService } from "../../services/next-event.service";


export const nextEventResolver: ResolveFn<EventProps | undefined> = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  
  const nextEventService = inject(NextEventService)
  const transitionEventId = route.paramMap.get('id')!;
  if (!transitionEventId) {
    return EMPTY;
  }

  const foundParentEvent = nextEventService.findParentEvent(+transitionEventId);
  return of(foundParentEvent)
};