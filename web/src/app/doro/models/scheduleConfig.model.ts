export interface IScheduleConfig {
  id: number;
  hash: string;
  scheduleHash: string;
  scheduleEventsHash: string;
  date: string | null;
  weekDay: number | null;
  dateModificator: any;
  schedule_id: number;
  scheduleEvent_id: number;
  counterIsPaused: boolean;
  counterStartTime: string;
  counterTimePassed: number;
  configIsActive: boolean;
  createdAt: string;
  updatedAt: string;
}
