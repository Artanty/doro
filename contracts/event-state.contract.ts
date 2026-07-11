export interface PlayEventReq {
    scheduleId: number;
    eventIdToPlay: number;
    playEventPlayhead?: number;
}

export interface PauseEventReq {
    "eventId": number
    "scheduleId": number
}

export interface BatchUpdateScheduleReq {
    scheduleUpdates: Array<{
        id: number;
        name?: string;
        active_event_id?: number;
        is_playing?: boolean;
        event_playhead?: number;
    }>;
}