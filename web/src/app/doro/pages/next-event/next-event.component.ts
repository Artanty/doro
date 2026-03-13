import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-next-event',
  templateUrl: './next-event.component.html',
  styleUrl: './next-event.component.scss',
  standalone: false,
})
export class NextEventComponent implements OnInit {
  @Input() public endedEvent: any = null
  @Input() public nextEvent: any = null
  @Output() public playNextAway = new EventEmitter<void>()
  @Output() public playFirstAway = new EventEmitter<void>()

  ngOnInit(): void {
    // if (!nextEvent.schedule_id) {

    // }  
  }
  
}
