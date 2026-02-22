export interface EventStatus {
    status: number
    currentSeconds: number
}

export interface EventProps {
    "id": number
    "name": string
    "length": number
    "event_type": string
    "last_state_change": string
    "access_level": string
}

export interface MinimalEventProps {
    id: number,
    length: number
}

export interface EventPropsPure {
    "id": number
    "name": string
    "length": number
    "type": string
    "created_at": string
}

//todo: rename to entry
export interface EventStateResItem {
    id: string,
    cur: number,
    len: number,
    stt: number
}