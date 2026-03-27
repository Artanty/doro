import { Injectable, NgZone } from "@angular/core";
import { Router } from "@angular/router";
import { AppStateService } from "./app-state.service";
import { dd } from "../helpers/dd";

@Injectable()
export class RouterService {
	constructor(
		private router: Router,
		private _state: AppStateService,
		private ngZone: NgZone
	) {}

	go(route: string) {
		const canGo = this.ngZone.runOutsideAngular(() => {
			return this._validate(route);
		});
		if (canGo) {
			this._state.lastAutoRedirect.next(route);
			this.ngZone.run(() => {
				this.router.navigateByUrl(route).then(() => {
					console.log('Navigation complete');
				});
			});
		} else {
			// dd('ROUTE GOING DISALLOWED: ' + route)
		}
	}

	private _validate(route: string): boolean {
		const lastRoute = this._state.lastAutoRedirect.getValue();
		const currentUrl = this.router.url;
		
		// Check if we're already on this route
		const isCurrentRoute = this._isSameRoute(currentUrl, route);
		if (isCurrentRoute) dd('isCurrentRoute');
		// Check if this is the last auto-redirect route
		const isLastRedirect = route === lastRoute;
		if (isLastRedirect) dd('isLastRedirect');
		// Don't allow if we're already on this route OR if it's the last redirect
		return !isCurrentRoute && !isLastRedirect;
	}

	private _isSameRoute(currentUrl: string, targetRoute: string): boolean {
		// Remove query parameters and fragments for comparison
		const cleanCurrent = currentUrl.split('?')[0].split('#')[0];
		const cleanTarget = targetRoute.split('?')[0].split('#')[0];
		
		// Handle root path
		if (cleanCurrent === '' && cleanTarget === '/') {
			return true;
		}
		
		// Add leading slash if missing for comparison
		const normalizedCurrent = cleanCurrent.startsWith('/') ? cleanCurrent : '/' + cleanCurrent;
		const normalizedTarget = cleanTarget.startsWith('/') ? cleanTarget : '/' + cleanTarget;
		
		return normalizedCurrent === normalizedTarget;
	}
}