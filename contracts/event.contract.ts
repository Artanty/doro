export interface CreateEventReq {
	name: string
	length: number
	is_rest: boolean,
	is_playing: boolean,
	playhead: number,
	
	schedule_id: number,
	is_public: boolean,

	hooks: any[],
	schedule_position?: number,
};