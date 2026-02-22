import { EventPropsDbItem } from "./event.types"

export interface Schedule {
    "id": number,
    "name": string
    "created_by": string
    "created_at": string
    "updated_at": string,
    events?: EventPropsDbItem[]
}