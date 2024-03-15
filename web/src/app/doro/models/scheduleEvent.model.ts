export interface IScheduleEvent {
  "id": number
  "name": string
  "timeFrom": string
  "timeTo": string
  "eventType": string
  "schedule_id": number
  "createdAt": string
  "updatedAt": string
}

export interface IScheduleEventView extends IScheduleEvent {
  isActive?: boolean
  timeLength?: number
  isPlaying?: boolean
  timeLeft?: string
  isEnded?: boolean
  isSuggestedNext?: boolean
}
