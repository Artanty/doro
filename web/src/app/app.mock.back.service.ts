import { Inject, Injectable, Injector } from "@angular/core";
import { Observable } from "rxjs";
import { BusEvent, EVENT_BUS_LISTENER, EVENT_BUS_PUSHER } from "typlib";
import { dd } from "./doro/helpers/dd";
// 0=inactive, 1=active, 2=paused 3=completed
@Injectable({
	providedIn: 'root'
})
export class MockBackService {
	private _tik: number = 0;
	private _event1 = {
		"cur": 3,
		"len": 25,
		"prc": 12,
		"stt": 2,
		"id": "e_209"
	}
	constructor(
		private injector: Injector,
		@Inject(EVENT_BUS_LISTENER)
		private readonly eventBusListener$: Observable<BusEvent>,
		@Inject(EVENT_BUS_PUSHER)
		private readonly eventBusPusher: (busEvent: BusEvent) => void,
	) {}

	private _countPrc(event: any) {
		return (event.cur / event.len) * 100;
	}

	public playEvent(id: string) {
		this._event1.stt = 1;
	}

	public pauseEvent(data: any) {
		this._event1.stt = 2;
	}

	public init() {

		setInterval(() => {
			this._tik++

			const event1 = JSON.parse(JSON.stringify(this._event1));
			const nextCur = event1.cur + 1;
			if (event1.stt === 1) {
				if (nextCur >= event1.len) {
					event1.cur = event1.len;
					event1.stt = 3;
				} else {
					event1.cur = nextCur;
				}
				event1.prc = this._countPrc(event1);	
			}
			this._event1 = event1

			
			// dd('mock tik run ')

			const busEvent: BusEvent = {
				"from": "tik@web",
				"to": "doro@web",
				"event": "SSE_DATA",
				"payload": [
					this._event1,
					// {
					// 	"cur": 20,
					// 	"len": 25,
					// 	"prc": 80,
					// 	"stt": 2,
					// 	"id": "e_208"
					// },
					// {
					// 	"cur": 25,
					// 	"len": 25,
					// 	"prc": 100,
					// 	"stt": 3,
					// 	"id": "e_207"
					// }
				]
			}
			// dd(busEvent)
			this.eventBusPusher(busEvent)  
		}, 1000)
	}

	
}

