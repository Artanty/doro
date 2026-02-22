import { EventStatus } from "./event-state.types"

export interface EventPropsDbItem {
	"id": number
	"name": string
	"length": number
	"type": number
	"created_at": string
	"updated_at": string | null,
	"schedule_id": number | null,
	"schedule_position": number | null,
	"created_by": string, //todo remve
	"base_access_id": number //todo remve
}



// export interface EventStateResItem { // todo: rename to entry
// 	id: string,
// 	cur: number,
// 	len?: number,
// 	stt?: EventProgressType
// }