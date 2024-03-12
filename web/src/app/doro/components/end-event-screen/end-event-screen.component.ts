import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-end-event-screen',
  templateUrl: './end-event-screen.component.html',
  styleUrl: './end-event-screen.component.scss'
})
export class EndEventScreenComponent {
  @Input() public endedEvent: any = null
  @Input() public nextEvent: any = null
  @Output() public playNextAway = new EventEmitter<void>()
  @Output() public playFirstAway = new EventEmitter<void>()

}
