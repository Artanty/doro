import { Nullable } from "../utils/utility.types"

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
    length: number,
    "event_type": number
}

//todo: rename to entry
export interface EventStateResItem {
    id: string,
    cur: number,
    len: number,
    stt: number
}

export interface ActionResult<T> {
    success: boolean;
    result: Nullable<T>;
    error?: null | string;
    debug?: any
}