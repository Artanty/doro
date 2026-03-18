export interface SuggestRestReq {
	scheduleId: number
}

export interface SuggestRestRes {
	"shouldTakeLongBreak": boolean
	"restType": "short",
	"restDuration": number
	"sessionsSinceLastLongBreak": number
	"lastEvents": {
		"type": number
		"length": number
		"schedule_position": number
		"state": number
	}[]
}