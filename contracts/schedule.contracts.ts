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