import { ChangeDetectorRef, Component, OnChanges, OnInit, SimpleChanges } from '@angular/core';
// import { hexColor } from '../../../utilites/hex-color';
import { CommonModule } from '@angular/common';
import { EventProps, EventWithState } from '../event.model';
import { EventService } from '../event.service';
import { Router } from '@angular/router';
import { GuiDirective } from '../../_remote/web-component-wrapper/gui.directive';
import { BehaviorSubject, debounceTime, delay, Observable, shareReplay, take, tap } from 'rxjs';
import { EventListEventComponent } from '../event-list-event/event-list-event.component';
import { dd } from 'src/app/doro/helpers/dd';

@Component({
  selector: 'app-event-list',
  standalone: false,
  //   standalone: true,
  //   imports: [
  //   GuiDirective, 
  //   CommonModule, 
  //   EventListEventComponent
  // ],
  templateUrl: './event-list.component.html',
  styleUrl: './event-list.component.scss'
})
export class EventListComponent implements OnInit {
  public events$: Observable<EventProps[]>;
 
  constructor(
    private eventService: EventService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {
    this.events$ = this.eventService.listenEvents().pipe(
      // debounceTime(50),
      // shareReplay(1),
      // delay(500),
      tap(res => {
        dd(res)
        setTimeout(() => {}, 1000); // crutch to update state
        
        // setTimeout(() => {
        //   this.cdr.detectChanges()
        // }, 1000); // crutch to update state
      })
    );
  }

  menuItems = [
    { id: 'DELETE', name: 'Удалить' },
  ];
  // onItemSelect(user: any, selectedAction: any) {
  //   // this.itemActionAway.emit({ user, selectedAction: selectedAction.id })
  // }

  ngOnInit() {
    this.eventService.loadEvents().pipe(take(1)).subscribe();
  }

  

  

  // public playEvent(eventId: number) {
  //   this.eventService.playEvent(eventId).subscribe(res => {
  //     const { state } = res;
  //     const events = this.events$.getValue().map(el => {
  //       if (el.eventId === eventId) {
  //         el.state = state;
  //       }
  //       return el;
  //     })
  //     this.events$.next(JSON.parse(JSON.stringify(events)))
  //     this.cdr.detectChanges()
  //   })
  // }

  // public pauseEvent(eventId: number) {
  //   this.eventService.pauseEvent(eventId).subscribe(res => {
  //     const { state } = res;
  //     const events = this.events$.getValue().map(el => {
  //       if (el.eventId === eventId) {
  //         el.state = state;
  //       }
  //       return el;
  //     })
  //     this.events$.next(JSON.parse(JSON.stringify(events)))
  //     this.cdr.detectChanges()
  //   })
  // }

  public deleteEvent(data: any) {
    // [id, event]: [number, Event]
    const [id, event]: [number, Event] = data;
    event.stopPropagation();
    // console.log('delete clicked')
    // this.eventService.deleteEvent(id).subscribe({
    //   next: () => this._loadEvents(),
    //   error: (err) => console.error('Error deleting keyword:', err)
    // });
  }

  // public goToKeywordEdit(id: number) {
  //   this.router.navigateByUrl('/note/keyword-edit' + '/' + id)
  // }

 
}