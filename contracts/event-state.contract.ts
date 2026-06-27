export interface PlayEventReq {
    scheduleId: number;
    eventIdToPlay: number;
    playEventPlayhead?: number;
}

export interface PauseEventReq {
    "eventId": number
    "scheduleId": number
}