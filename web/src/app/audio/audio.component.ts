import {ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Inject, ViewChild} from '@angular/core';
import {NgIf} from "@angular/common";

@Component({
  selector: 'app-audio',
  standalone: true,
  imports: [
    NgIf
  ],
  templateUrl: './audio.component.html',
  styleUrl: './audio.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AudioComponent {
  @ViewChild('player', {static:true}) playerRef!: ElementRef; //
  isPlaying: boolean = false
  constructor(
    @Inject (ChangeDetectorRef) private cdr: ChangeDetectorRef
  ) {
  }

  play () {
    const player = this.playerRef.nativeElement as HTMLAudioElement
    if (player.paused !== false) {
      player.play();
      this.isPlaying = true;
      this.cdr.detectChanges()
    }
  }
  pause () {
    const player = this.playerRef.nativeElement as HTMLAudioElement
    if (player.paused === false) {
      player.pause();
      this.isPlaying = false;
      this.cdr.detectChanges()
    }
  }
}
