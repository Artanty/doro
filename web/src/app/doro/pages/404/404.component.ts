import {
  Component,
  EventEmitter,
  Output
} from '@angular/core';

@Component({
  selector: 'app-noise',
  templateUrl: './noise.component.html',
  styleUrl: './noise.component.scss'
})
export class NoiseComponent {
  @Output() reconnectAway: EventEmitter<any> = new EventEmitter<any>()

  reconnect () {
    this.reconnectAway.emit()
  }
}
