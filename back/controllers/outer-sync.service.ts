import axios from "axios";
import { EVENT_TIK_ACTION_PROP } from "../core/constants";
import { dd } from "../utils/dd";
import { parseServerResponse } from "../utils/parseServerResponse";
import { ConfigManager } from "./config-manager";
import { upsertEventState } from "../db-actions/upsert-event-state";
import createPool from "../core/db_connection";
import { thisProjectResProp } from "../utils/getResProp";
import { addEventStateHistory } from "../db-actions/add-event-state-history";
import { EventStateResItem } from "../types/event-state.types";
import { getEventStateHooksByState } from "../db-actions/get-event-state-hooks";
import { EventStateHookController } from "./event-state-hook.controller";
import { buildOuterEntityId, EntryType } from "../utils/buildOuterEntityId";
import { TikUpdateEntriesRes } from "../types/outer-sync.types";
import { getEventByIdDb } from "../db-actions/get-event-by-id.db";
import { updateScheduleDb } from "../db-actions/update-schedule.db";

export interface TikResStat {
	added: string[],
	addedCount: number,
	deleted: string[],
	deletedCount: number,
	updated: string[],
	updatedCount: number,
}

export interface TikRes {
	desc: string,
	stat: TikResStat,
	success: boolean
}

export interface OuterEntry {
	id: string,
	[EVENT_TIK_ACTION_PROP]: string,
	cur?: number,
	len?: number,
	stt?: number
}

export interface OuterHash {
	id: string,
	cur: number,
}

export type EntryWithTikAction<T> = T & { [EVENT_TIK_ACTION_PROP]: string };


export class OuterSyncService {

	public static buildOuterHash(params?: {
        userHandler: string, 
        hashType: string
    }): OuterHash {
		// let userHandler = params?.userHandler ?? '74aa6454c1fcabffea7ff172:324c9c440c841889632429b574a39942';
		let hashType = params?.hashType ?? 'events';
		let tikEntryId = hashType === 'events' 
		 ? 1
		 : 2;
		
		return {
			id: buildOuterEntityId('configHash', tikEntryId),
			cur: ConfigManager.getConfigHash(params),
		};
	}

	/**
	 * Предполагается, что new event не требует запроса в БД для вычисления своего состояния.
	 * */
	public static buildOuterEvent(
		id: string | number, 
		length: number, 
		state: number, 
		currentSeconds: number,
		entryType: EntryType
	): EventStateResItem {
		return {
			id: buildOuterEntityId(entryType, id),
			cur: currentSeconds,
			len: length,
			stt: state
		}	
	}
    
	public static buildUpdateOuterHashPayload(action: string, params?): EntryWithTikAction<OuterHash>[] {

		return this.addOuterActionInEvents<OuterHash>(this.buildOuterHash(params), action);
	}
	// todo add prop tikAction, default = upsert
	public static buildNewOuterEventPayload(
		id: string | number, 
		length: number, 
		state: number, 
		entryType: EntryType = 'event',
		currentSeconds: number = 0,
	): EntryWithTikAction<EventStateResItem>[] {
		return this.addOuterActionInEvents(this.buildOuterEvent(id, length, state, currentSeconds, entryType), 'upsert');
	}

	static addOuterActionInEvents<T extends Record<string, any>>(
		events: T | T[], 
		action: string
		// ): (T & { [EVENT_TIK_ACTION_PROP]: string })[] {
	): EntryWithTikAction<T>[] {
		
		const eventsArray = Array.isArray(events) ? events : [events];
    
		return eventsArray.map(event => ({
			...event,
			[EVENT_TIK_ACTION_PROP]: action
		}));
	}

	// sending initial state
	// should be after login in future
	public static async updateOuterConfigHash(
		reqHeaders: Record<string, string | string[] | undefined>
	): Promise<TikRes> {
		const userHandler = '74aa6454c1fcabffea7ff172:324c9c440c841889632429b574a39942';
   
		const outerHash1 = {
			id: buildOuterEntityId('configHash', 1),
			cur: ConfigManager.getConfigHash({ userHandler, hashType: 'events' }),
		};
		const outerHash2 = {
			id: buildOuterEntityId('configHash', 2),
			cur: ConfigManager.getConfigHash({ userHandler, hashType: 'schedules' }),
		};

		const payload = this.addOuterActionInEvents([outerHash1,outerHash2], 'upsert');
		
		let tikResponse;
		try {
			tikResponse = await axios.post(`${process.env['TIK_BACK_URL']}/updateEventsState`,
				{
					poolId: 'current_user_id',
					data: payload,
					// requesterProject,
					// requesterApiKey: apiKeyHeader,
					// requesterUrl
				},
				{
					timeout: 10000,  // Таймаут 10 секунд на каждый запрос
					headers: {
						'Content-Type': 'application/json',
						'authorization': reqHeaders?.['authorization'],
						'x-web-host-url': reqHeaders?.['x-web-host-url'],
					}
				}
				// ,
				//  {
				//   headers: {
				//     'X-Project-Id': process.env.PROJECT_ID,
				//     'X-Project-Domain-Name': `${req.protocol}://${req.get('host')}`,
				//     'X-Api-Key': process.env.BASE_KEY
				//   }
				// }
			);
		} catch (error: any) {
			console.error('process.env[TIK_BACK_URL]/updateEventsState error:', error.message);
			throw new Error(error);
		}
		
		return tikResponse;
	}

	// todo: add api key.
	public static async updateOuterEntries(
		payload: OuterEntry[],
		reqHeaders: Record<string, string | string[] | undefined>
	): Promise<TikUpdateEntriesRes> {
		let tikResponse;
		try {
			// todo rename 'updateEventsState' -> updateEntries
			tikResponse = await axios.post(`${process.env['TIK_BACK_URL']}/updateEventsState`,
				{
					data: payload,
					projectId: 'doro@web',
				},
				{
					timeout: 10000,
					headers: {
						'Content-Type': 'application/json',
						'authorization': reqHeaders?.['authorization'],
						'x-web-host-url': reqHeaders?.['x-web-host-url'],
					}
				}
			);
		} catch (error: any) {
			console.error('process.env[TIK_BACK_URL]/updateEventsState error:', error.message);
			throw new Error(error);
		}
		
		return parseServerResponse(tikResponse);
	}

	/**
	 * 1) проверяем access + достаем schedule_id
	 * 1) обновить is_playing schedul'а
	 * 2) сформировать обновление schedule hash для tik@back
	 * */
	public static async updateEventStateByOuterApp(
		userHandler: string,
		eventId: number,
		state: any,
	) {
		const isPlaying = state !== 3;
		const pool = createPool();
		const connection = await pool.getConnection();
		let
			getEventByIdResult,
			updateScheduleResult,
			tikEventsPayload: OuterEntry[] = []
			;
		let outerEntries = [];
		try {
			await connection.beginTransaction();
			
			getEventByIdResult = await getEventByIdDb(
				connection,
				userHandler,
				eventId
			);
			if(!getEventByIdResult.success) {
				throw new Error(getEventByIdResult.error!);
			}

			updateScheduleResult = await updateScheduleDb(
				connection,
				getEventByIdResult.result[0].schedule_id,
				{
					is_playing: isPlaying,
					event_playhead: getEventByIdResult.result[0].length,
				}
			)
	
			if (!updateScheduleResult.success) {
				throw new Error(updateScheduleResult.error!);
			}
						
			ConfigManager.setConfigHash({ userHandler, hashType: 'events' });
			ConfigManager.setConfigHash({ userHandler, hashType: 'schedules' });
			const hashPayload = OuterSyncService.buildUpdateOuterHashPayload('upsert', { userHandler, hashType: 'events'});
			const schedulesHashPayload = OuterSyncService.buildUpdateOuterHashPayload('upsert', { userHandler, hashType: 'schedules'});

			return {
				success: true,
				result: [...hashPayload, ...schedulesHashPayload],
				debug: {
					[thisProjectResProp()]: {
						getEventByIdResult,
						updateScheduleResult
					},
				}
			};

		} catch (error) {
			await connection.rollback();
			return {
				success: false,
				error,
				debug: {
					[thisProjectResProp()]: {
						getEventByIdResult,
						updateScheduleResult
					}
				}
			};
		} finally {
			connection.release();
		}
	}

}