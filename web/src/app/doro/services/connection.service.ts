import { Injectable } from "@angular/core";

@Injectable({
	providedIn: 'root'
})
export class ConnectionService {
	// one connection with one backend at a time
	public connections: Record<string, any> = {}
	// private backendEvents: 

	setBackend(backend: string) {
		if (!this.connections[backend]) {
			this.connections[backend] = { 
				name: backend,
				events: {}
			};	
		} else {
			throw new Error('connection with backend ' + backend + ' already set')
		}
	}

	addEvent(backend: string, poolId: string) {
		if (!this.connections[backend]) {
			this.setBackend(backend)
		}
		const currentBackend = this.connections[backend];
		currentBackend.events[poolId] = { state: 1 };
	}


}