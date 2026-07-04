import { Res } from "./contracts.base"

export interface CreateEventReq {
	name: string
	length: number
	is_rest: boolean,
	is_playing: boolean,
	playhead: number,
	schedule_id: number,
	hooks: any[],
	schedule_position?: number,
};

export interface CreateEventResData {
	id: number
};

export type CreateEventRes = Res<CreateEventResData>

export interface GetEventResDataItem {
    "id": number
    "name": string
    "length": number
    "is_rest": number
    "updated_at": string
    "schedule_id": number
    "schedule_name": string
    "schedule_is_playing": number
    "schedule_active_event_id": number
    "schedule_position": number
    "playhead": number
    "schedule_owner": string
    "is_active_event": number
}

export type GetEventRes = Res<GetEventResDataItem[]>