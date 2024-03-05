export interface IEndEventSseResponse {
    endedEvent: number,
    nextEvent: number,
    schedule_id: number,
    action: string
    scheduleConfigHash: string
}


export interface ISuggestNextEventSseResponse {
    "endedEvent": number,
    "nextEvent": number,
    "schedule_id": number,
    "action": string,
    "nextAction": string,
    "scheduleConfigHash": string,
}
