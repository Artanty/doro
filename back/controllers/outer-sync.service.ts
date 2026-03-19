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
	public static buildNewOuterEvent(
		id: string | number, length: number, state: number,
		entryType: EntryType
	): EventStateResItem {
		return {
			id: buildOuterEntityId(entryType, id),
			cur: 0, // v2 событие может быть создано с плейхэдом не в нулевой точке.
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
		entryType: EntryType = 'event'
	): EntryWithTikAction<EventStateResItem>[] {
		// todo: мб убрать add и оставить только upsert?
		// разница только в дебаг-отчете, который и без этого корректно сложится
		return this.addOuterActionInEvents(this.buildNewOuterEvent(id, length, state, entryType), 'add');
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
	 * 2) добавить в историю стейта -"-
	 * 3) глянуть, что в хуке на "закончить"
	 * 4) инициализировать хук через tik@
	 * т. е. отправить в ответ создание соответствующего тик-ентри.
	 * 
	 * пример. работа закончена, смотрим хук, там предложка следующего события.
	 * отправляем в тик@ ентри с названием nextEvent, 
	 * ЧТО ВАЖНО.
	 * этот nextEvent - тоже является событием, у которого есть длительность.
	 * все клиенты должны видеть стейт показа компонента nextEvent до тех пор
	 *  пока не будет выбрано следующее действие.
	 * поэтому надо его как-то зафризить.
	 * ПЛЮС.
	 * Если сейчас есть 2 события, которые закончены - все они должны предлагать что делать дальше.
	 * то есть нужна табличка? с предложкой(транзишэнами), у которой будет флаг комплит.
	 * ЧТО ЕСЛИ
	 * транзишн - это ивент с типом 3 ?
	 * значит он может быть 
	 * - создан как событие
	 * - отправлен в тик по обычной схеме. можно дать ему другой префикс.
	 * А МОЖНО
	 * создать таблицу transitions
	 * и добавлять туда записи с привязкой к id ивента.
	 * ЧТО ЛУЧШЕ?
	 * тип 3 - юзаем текущую инфраструктуру
	 * transitions - имеем четкую привязку, но завязаны один к одному, значит это не плюс а минус.
	 * ИТОГ
	 * юзаем events.
	 * где-то нужно держать инфу - кто вызвал этот тразишон, окончание какого события. 
	 * ГДЕ?
	 * ++
	 * А ТАКЖЕ у нас есть таблица хуков, где ясно при каком условии вызывается хук.
	 * он уже создан заранее. остается его кинуть в тик.
	 * плюс добавить ему флаг? стейт?
	 * если флаг, то актив-неактив
	 * что значит, что он может быть отключен? оно надо так? придется дефолт какой-то показывать.
	 * оно не надо так. мы специально создаем дефолт, чтобы дальше избавиться от ветвления кода.
	 * если стейт - то:
	 * реади? комплит?
	 * реади- не надо. комплит - надо, чтобы убрать.
	 * НЕТ
	 * хук не имеет таблицы стейта и не предназначен для этого.
	 * спользуем ивентс.
	 * как
	 * ивент заканчивается, тик идет в доро бэк, там дефолтный хук, 
	 * который создает событие с типом 3 и расписанием вызвавшего его ивента.
	 * тип 3 будет отвечать за то, что он смотрит, какое событие 
	 * в расписании закончилось недавней всего и какое предложить следующее.
	 * особытие типа 3 НЕ может иметь стейт ПАУЗА или СТОП
	 * особытие типа 3 НЕ может иметь длительность, точнее ее нужно настроить.
	 * особытие типа 3 НЕ сохраняется в таблице event state history?
	 * для простых расписаний не актуально. для проектных - норм, что после недели движ возобновляется.
	 * по умолчани. 24 часа. 
	 * когда мы загружаемся после падения всех серверов
	 * смотрим что есть событие с типом 3 в текущем расписании и оно не является законченным.
	 * v4 также проверить, чтобы в расписании не тикали никакие другие события.
	 * вычисляем, что должно быть предложено юзеру, предлагаем.
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

			getEventStateHooksResult = await getEventStateHooksByState(connection, eventId, state);
			if (getEventStateHooksResult.success) {
				runEventStateHooksResult = await EventStateHookController.runHooks(connection, getEventStateHooksResult.hooks)
			}

			await connection.commit();

			dd(runEventStateHooksResult)

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