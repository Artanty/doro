import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ResponseLogEntry {
  timestamp: string
  method: string
  url: string
  status: number
  requestBody?: string
  response: string
  customData?: string
}

@Component({
  selector: 'app-log-viewer',
  templateUrl: './log-viewer.component.html',
  styleUrl: './log-viewer.component.scss',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LogViewerComponent {
  @Input() log!: ResponseLogEntry;

  get statusClass(): string {
    if (this.log.status >= 200 && this.log.status < 300) return 'status--success';
    if (this.log.status >= 300 && this.log.status < 400) return 'status--redirect';
    if (this.log.status >= 400 && this.log.status < 500) return 'status--client-error';
    return 'status--server-error';
  }

  get parsedRequest(): Record<string, unknown> | null {
    if (!this.log.requestBody) return null;
    try {
      return JSON.parse(this.log.requestBody) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  get parsedResponse(): Record<string, unknown> | null {
    try {
      return JSON.parse(this.log.response) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}
