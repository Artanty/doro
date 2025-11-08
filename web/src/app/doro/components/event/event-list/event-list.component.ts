import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
// import { hexColor } from '../../../utilites/hex-color';
import { CommonModule } from '@angular/common';
import { DoroEvent, EventWithState } from '../event.model';
import { EventService } from '../event.service';
import { Router } from '@angular/router';
import { GuiDirective } from '../../_remote/web-component-wrapper/gui.directive';
import { BehaviorSubject, Observable } from 'rxjs';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [GuiDirective, CommonModule],
  templateUrl: './event-list.component.html',
  styleUrl: './event-list.component.scss'
})
export class EventListComponent implements OnInit {
  public events: EventWithState[] = [];
 
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

  public playEvent(id: number) {
    this.eventService.playEvent(id)
  }
  public deleteEvent(id: number, event: Event) {
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
    this.eventService.getUserEventsWithState().subscribe({
      next: (events) => {
        this.events = events
        this.cdr.detectChanges()
      },
      error: (err) => console.error('Error loading events:', err)
    });
  }
}