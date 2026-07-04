import { Res } from "./contracts.base"

export interface CreateFullScheduleReq {
    work: number,
    rest: number,
    bigRest: number,
    bigRestStep: number,
    cycles: number,
};

export interface CreateScheduleResData {
    scheduleId: number
}

export type CreateScheduleRes = Res<CreateScheduleResData>


export interface ScheduleListResDataItem {
    "id": number
    "name": string
    "created_by": string
    "created_at": string
    "updated_at": string
    "active_event_id": number
    "is_playing": number
}

export type ScheduleListRes = Res<ScheduleListResDataItem[]>