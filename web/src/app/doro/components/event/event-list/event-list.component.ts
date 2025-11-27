import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
// import { hexColor } from '../../../utilites/hex-color';
import { CommonModule } from '@angular/common';
import { DoroEvent, EventWithState } from '../event.model';
import { EventService } from '../event.service';
import { Router } from '@angular/router';
import { GuiDirective } from '../../_remote/web-component-wrapper/gui.directive';
import { BehaviorSubject, Observable } from 'rxjs';
import { EventListEventComponent } from '../event-list-event/event-list-event.component';
import { dd } from 'src/app/doro/helpers/dd';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [GuiDirective, CommonModule, EventListEventComponent],
  templateUrl: './event-list.component.html',
  styleUrl: './event-list.component.scss'
})
export class EventListComponent implements OnInit {
  public events$ = new BehaviorSubject<EventWithState[]>([]);
 
  constructor(
    private eventService: EventService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  menuItems = [
    { id: 'DELETE', name: 'Удалить' },
  ];
  // onItemSelect(user: any, selectedAction: any) {
  //   // this.itemActionAway.emit({ user, selectedAction: selectedAction.id })
  // }

  ngOnInit() {
    this._loadEvents();
  }

  public handleEventAction(data: [string, any]): void {
    // const [action, eventId] = data
    // switch (action) {
    //   case 'play': this.playEvent(eventId)
    //     break;
    //   case 'pause': this.pauseEvent(eventId)
    //     break;
    //   default: throw new Error(`Action ${action} not implemented`)
    // }
    dd(data)
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
    console.log('delete clicked')
    this.eventService.deleteEvent(id).subscribe({
      next: () => this._loadEvents(),
      error: (err) => console.error('Error deleting keyword:', err)
    });
  }

  // public goToKeywordEdit(id: number) {
  //   this.router.navigateByUrl('/note/keyword-edit' + '/' + id)
  // }

  private _loadEvents(): void {
    this.eventService.getUserEventsWithStateApi().subscribe({
      next: (events) => {
        this.events$.next(events)
        this.cdr.detectChanges()
      },
      error: (err) => console.error('Error loading events:', err)
    });
  }
}