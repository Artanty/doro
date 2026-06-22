import { Component, OnInit, Input, ChangeDetectorRef } from "@angular/core";
import { Observable } from "rxjs";
import { DEFAULT_EVENT_STATE_HOOKS } from "../../constants";
import { AccessLevel } from "../../services/access-level.service";
import { CreateEventReq } from "../../services/basic-event/basic-event-api.types";
import { EventService } from "../../services/basic-event/basic-event.service";
import { Schedule } from "../../services/basic-event/basic-event.types";
import { ScheduleService } from "../../services/schedule/schedule.service";
import { dd } from "../../helpers/dd";


@Component({
  selector: 'app-create-event',
  standalone: false,
  templateUrl: './create-event.component.html',
  styleUrl: './create-event.component.scss',
})
export class CreateEventComponent implements OnInit {
  @Input() scheduleId?: string;

  // Данные события
  eventData = {
    name: '',
    length: 3600, // 1 час по умолчанию
    type: 1, // work
    isPlaying: true,
    schedule_id: 1,
    // base_access: false
  };

  // Список типов событий
  eventTypes: any[] = [{id: 1,name: 'Работа' },{id: 2,name: 'Отдых'}];

  // Уровни доступа
  accessLevels: AccessLevel[] = [
    { id: 1, name: 'Личный' },
    { id: 2, name: 'Публичный' },
  ];

  isLoading = false;
  submitted = false;
  errorMessage = '';
  successMessage = '';
  createdEventId = '';
  createdEventName = '';
  public schedules$: Observable<Schedule[]>

  constructor(
    private cdr: ChangeDetectorRef,
    private _eventService: EventService,
    private _scheduleService: ScheduleService
  ) {
    this.schedules$ = this._scheduleService.getSchedules()
  }

  ngOnInit(): void {
  }
  // Отправка формы
  onSubmit() {
    this.submitted = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Валидация
    if (!this.eventData.name || !this.eventData.type || !this.eventData.length || this.eventData.length <= 0) {
      this.errorMessage = 'Заполните все обязательные поля';
      this.cdr.detectChanges()
      return;
    }

    this.isLoading = true;

    // Подготовка данных для отправки
    const payload: CreateEventReq = {
      name: this.eventData.name,
      length: Number(this.eventData.length),
      is_rest: Number(this.eventData.type) === 2,
      is_playing: this.eventData.isPlaying,
      playhead: 0,

      schedule_id: Number(this.eventData.schedule_id),
      // is_public: this.eventData.base_access, 

      hooks: DEFAULT_EVENT_STATE_HOOKS,
    };
    
    this._eventService.createEvent(payload).pipe().subscribe({
      next: (response: any) => {

        this.isLoading = false;
        this.successMessage = 'Событие успешно создано!';
        this.createdEventId = response.id || 'N/A';
        this.createdEventName = this.eventData.name;
        
        this.resetForm();
      },
      error: (error) => {
        this.isLoading = false;
        
        if (error.status === 400) {
          this.errorMessage = 'Неверные данные. Проверьте введенные значения.';
        } else if (error.status === 401 || error.status === 403) {
          this.errorMessage = 'Ошибка авторизации. Войдите в систему.';
        } else {
          this.errorMessage = `Ошибка сервера: ${error.message || 'Неизвестная ошибка'}`;
        }
        this.cdr.detectChanges()
        console.error('Ошибка создания события:', error);
      }
    });
  }

  // Сброс формы
  resetForm() {
    this.eventData = {
      name: '',
      length: 3600,
      type: 1,
      isPlaying: true,
      schedule_id: 1,
      // base_access: false,
    };
    this.submitted = false;
    this.errorMessage = '';
    this.successMessage = '';
    this.createdEventId = '';
    this.createdEventName = '';
    this.cdr.detectChanges()
  }

  // Получение текста длительности
  getDurationText(): string {
    const hours = Math.floor(this.eventData.length / 3600);
    const minutes = Math.floor((this.eventData.length % 3600) / 60);
    
    if (hours > 0 && minutes > 0) {
      return `${hours} ч ${minutes} мин`;
    } else if (hours > 0) {
      return `${hours} час`;
    } else if (minutes > 0) {
      return `${minutes} минут`;
    } else {
      return `${this.eventData.length} секунд`;
    }
  }
}