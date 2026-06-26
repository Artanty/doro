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