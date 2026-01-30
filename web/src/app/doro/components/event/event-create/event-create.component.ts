import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { delay } from 'rxjs';
import { Router } from '@angular/router';
import { EventService } from '../event.service';
import { AccessLevel, AccessLevelService } from '../access-level.service';
import { EventType, EventTypeService } from '../event-type.service';

@Component({
  selector: 'app-event-create',
  standalone: false,
  // imports: [CommonModule, FormsModule],
  templateUrl: './event-create.component.html',
  styleUrl: './event-create.component.scss',
})
export class EventCreateComponent implements OnInit {
  // Данные события
  eventData = {
    name: '',
    length: 3600, // 1 час по умолчанию
    type: 1, // work
    base_access: 1, // Значение по умолчанию
    state: 0,
  };

  // Список типов событий
  eventTypes: EventType[] = [];

  eventStates = [
    { id: 0, name: 'Остановлено' },
    { id: 1, name: 'Проигрывается' },
    { id: 2, name: 'На паузе' },
    { id: 3, name: 'Завершено' },
  ]

  // Уровни доступа
  accessLevels: AccessLevel[] = [];

  // Состояние компонента
  isLoading = false;
  submitted = false;
  errorMessage = '';
  successMessage = '';
  createdEventId = '';
  createdEventName = '';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private _eventService: EventService,
    private _accessLevelService: AccessLevelService,
    private _eventTypeService: EventTypeService
  ) {}

  ngOnInit(): void {
    this._eventTypeService.getEventTypes().subscribe(res => {
      this.eventTypes = res
    })
    this._accessLevelService.getAccessLevels()
      .subscribe(res => {
        this.accessLevels = res.slice(0, 2).map(el => {
          return {
            id: el.id, 
            name: el.description,
            description: el.description,
            sort_order: el.sort_order
          }
        });
        this.cdr.detectChanges()
      });
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
    const payload = {
      name: this.eventData.name,
      length: Number(this.eventData.length),
      type: Number(this.eventData.type),
      // Если private - придумать
      base_access: this.eventData.base_access,
      state: this.eventData.state,      
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
      type: 2,
      base_access: 1,
      state: 0,
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

  // Получение названия уровня доступа
  getAccessLabel(value: number): string {
    const access = this.accessLevels.find(a => a.id === value);
    return access ? access.name : 'Не указано';
  }
}