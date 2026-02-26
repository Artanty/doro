export interface EventPropsDTO {
	id: number;
	name: string;
	length: number;
	type: number;
	// type_name: string; // replace to dictionaries
	created_at: string;
	updated_at: string | null;
	created_by: string; // hide on backend
	schedule_id: number | null;
	schedule_position: number | null;
	// base_access: "public-read"; //remove on backend
	base_access_id: number;
	// access_level: "owner" | "editor" | "viewer"; //remove on backend
	has_access: number; // 0 or 1 (boolean)
	event_state_id: number;
}

export interface ScheduleDTO {
	id: number;
	name: string;
	created_by: string;
	created_at: Date | string;
	updated_at: Date | string;
	events?: EventPropsDTO[];
}

export interface GetRecentRes {
	data: {
		recentEvent?: EventPropsDTO,
		recentSchedule?: ScheduleDTO,
	}
}