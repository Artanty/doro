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

	public static buildOuterHash(): OuterHash {
		return {
			id: buildOuterEntityId('configHash', 1), // 1 - id
			cur: ConfigManager.configHash,
		};
	}

	/**
	 * Предполагается, что new event не требует запроса в БД для вычисления своего состояния.
	 * */
	public static buildOuterEvent(
		id: string | number, length: number, state: number, currentSeconds: number,
		entryType: EntryType
	): EventStateResItem {
		return {
			id: buildOuterEntityId(entryType, id),
			cur: currentSeconds,
			len: length,
			stt: state
		}	
	}
    

	public static buildUpdateOuterHashPayload(action: string): EntryWithTikAction<OuterHash>[] {

		return this.addOuterActionInEvents<OuterHash>(this.buildOuterHash(), action);
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

	public static async updateOuterConfigHash(): Promise<TikRes> {
		dd('updateOuterConfigHash started: ' + ConfigManager.configHash)
        
		const payload = this.buildUpdateOuterHashPayload('upsert');
		let tikResponse;
		try {
			tikResponse = await axios.post(`${process.env['TIK_BACK_URL']}/updateEventsState`,
				{
					poolId: 'current_user_id',
					data: payload,
					projectId: 'doro@web',

					// requesterProject,
					// requesterApiKey: apiKeyHeader,
					// requesterUrl
				},
				{
					timeout: 10000,  // Таймаут 10 секунд на каждый запрос
					headers: {
						'Content-Type': 'application/json'
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
		dd('updateOuterConfigHash result:')
		dd(parseServerResponse(tikResponse))
		return tikResponse;
	}

	// todo: add api key.
	public static async updateOuterEntries(payload: OuterEntry[]): Promise<any> {
		let tikResponse;
		try {
			// todo rename 'updateEventsState' -> updateEntries
			tikResponse = await axios.post(`${process.env['TIK_BACK_URL']}/updateEventsState`,
				{
					poolId: 'current_user_id',
					data: payload,
					projectId: 'doro@web',
				},
				{
					timeout: 10000,  // Таймаут 10 секунд на каждый запрос
					headers: {
						'Content-Type': 'application/json'
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
	 * todo: check required api key
	 * 
	 * 1) изменить стейт ивента на "закончено"
	 * 2) добавить в историю стейта "закончено"
	 * 3) глянуть, что в хуке на "закончить"
	 * 4) (как правило) создать ивент с префиксом (t) - transition
	 * 5) отправить его в ответе для upsert в tik@
	 * 6) обновить хэш
	 *
	 * nextEvent - тоже является событием, у которого есть длительность.
	 * 
	 * особытие типа 3 НЕ может иметь стейт ПАУЗА (2) или СТОП (0), создается сразу с play(1)
	 * особытие типа 3 НЕ сохраняется в таблице event state history?
	 * для простых расписаний не актуально. для проектных - норм, что после недели движ возобновляется.
	 * по умолчанию 24 часа. 
	 * когда мы загружаемся после падения всех серверов
	 * смотрим что есть событие с типом 3 в текущем расписании и оно не является законченным.
	 * 
	 * */
	public static async updateEventStateByOuterApp(
		eventId: number,
		state: any,
	) {
		const pool = createPool();
		const connection = await pool.getConnection();
		let upsertStateResult,
			addEventStateHistoryResult,
			getEventStateHooksResult,
			runEventStateHooksResult;
		let outerEntries = [];
		try {
			await connection.beginTransaction();
			
			upsertStateResult = await upsertEventState(connection, eventId, state)
			
			if (upsertStateResult.isStateUpdated) {
				addEventStateHistoryResult = await addEventStateHistory(connection, eventId, state)    
			}
			await connection.commit();
			connection.release();
			await connection.beginTransaction();
			getEventStateHooksResult = await getEventStateHooksByState(connection, eventId, state);
			
			if (getEventStateHooksResult.success) {
				runEventStateHooksResult = await EventStateHookController.runHooks(connection, getEventStateHooksResult.hooks)
			}

			await connection.commit();

			if (runEventStateHooksResult.success) {
				outerEntries = runEventStateHooksResult.result
			}

			await ConfigManager.setConfigHash();
			const hashPayload = this.buildUpdateOuterHashPayload('upsert');

			return {
				success: true,
				result: [...outerEntries, ...hashPayload], 
				debug: {
					[thisProjectResProp()]: {
						upsertStateResult,
						addEventStateHistoryResult,
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
						upsertStateResult,
						addEventStateHistoryResult
					}
				}
			};
		} finally {
			connection.release();
		}
	}

	// public static entryAdapter(outerPayload: any): { eventId: number, state: number } {
	// 	const { eventId, state } = outerPayload;
	// 	return { eventId, state }
	// }
}