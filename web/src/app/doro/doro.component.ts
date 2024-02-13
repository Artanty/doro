import { trigger, transition, style, animate } from '@angular/animations';
import { Component, Inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { StoreService } from './services/store.service';
import {SseService} from "./services/sse.service";

@Component({
  selector: 'app-doro',
  templateUrl: './doro.component.html',
  styleUrl: './doro.component.scss',
  animations: [
    trigger('animationTriggerName', [
      transition(':enter', [
        style({ transform: 'translateX(-100%)', opacity: 0 }),
        animate('300ms ease', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        style({ opacity: 1 }),
        animate('0.3s', style({ opacity: 0 })),
      ]),
    ]),
    ]
})
export class DoroComponent {
  // viewState: BehaviorSubject<string> = new BehaviorSubject('counter')
  viewState: Observable<any>

  constructor (
    @Inject(StoreService) private StoreServ: StoreService,
    @Inject(SseService) private SseServ: SseService
  ) {
    // this.StoreServ.listenViewState().subscribe(res=> console.log(res))
    this.viewState = this.StoreServ.listenViewState()
    this.SseServ.createEventSource()
  }

}
