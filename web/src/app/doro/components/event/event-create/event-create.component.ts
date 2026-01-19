import { ChangeDetectorRef, Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { delay } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-event-create',
  standalone: false,
  // imports: [CommonModule, FormsModule],
  templateUrl: './event-create.component.html',
  styleUrl: './event-create.component.scss',
})
export class EventCreateComponent {
  // Данные события
  eventData = {
    name: '',
    length: 3600, // 1 час по умолчанию
    type: 2,
    base_access: 'private', // Значение по умолчанию
    state: 0,
  };

  // Список типов событий
  eventTypes = [
    { id: 1, name: 'Совещание' },
    { id: 2, name: 'Вебинар' },
    { id: 3, name: 'Конференция' },
    { id: 4, name: 'Тренинг' },
    { id: 5, name: 'Встреча' }
  ];

  eventStates = [
    { id: 0, name: 'Остановлено' },
    { id: 1, name: 'Проигрывается' },
    { id: 2, name: 'На паузе' },
    { id: 3, name: 'Завершено' },
  ]

  // Уровни доступа
  accessLevels = [
    { 
      value: 'private', 
      label: 'Приватный', 
      description: 'Только вы и указанные пользователи',
      icon: '🔒'
    },
    { 
      value: 'public-read', 
      label: 'Публичный (чтение)', 
      description: 'Все могут просматривать, редактировать только вы',
      icon: '👁️'
    },
    { 
      value: 'public-write', 
      label: 'Публичный (запись)', 
      description: 'Все могут просматривать и редактировать',
      icon: '✏️'
    }
  ];

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
    private router: Router
  ) {}

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
      base_access: this.eventData.base_access !== 'private' ? this.eventData.base_access : null, // Если private, отправляем null или не включаем поле
      state: this.eventData.state,      
    };

    const apiUrl = `${process.env['DORO_BACK_URL']}/event/create`;

    this.http.post(apiUrl, payload).pipe(delay(1000)).subscribe({
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
      base_access: 'private',
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
  getAccessLabel(value: string): string {
    const access = this.accessLevels.find(a => a.value === value);
    return access ? access.label : 'Не указано';
  }
}