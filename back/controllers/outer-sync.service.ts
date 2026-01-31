import axios from "axios";
import { EVENT_TIK_ACTION_PROP } from "../core/constants";
import { dd } from "../utils/dd";
import { parseServerResponse } from "../utils/parseServerResponse";
import { ConfigManager } from "./config-manager";
import { EventStateController, EventStateResItem } from "./eventStateController";

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
	

	public static buildOuterEntityId(
		type: 'event' | 'configHash', 
		id: string | number
	): string {
		const entitiesMap = {
			event: 'e',
			configHash: 'h'
		}

		const entityPrefix = entitiesMap[type]

		return `${entityPrefix}_${id}`;
	}

	public static buildOuterHash(): OuterHash {
		return {
			id: this.buildOuterEntityId('configHash', 1), // 1 - id
			cur: ConfigManager.configHash,
		};
	}

	/**
	 * Предполагается, что new event не требует запроса в БД для вычисления своего состояния.
	 * */
	public static buildNewOuterEvent(
		id: string | number, length: number, state: number
	): EventStateResItem {
		return {
			id: this.buildOuterEntityId('event', id),
			cur: 0, // v2 событие может быть создано с плейхэдом не в нулевой точке.
			len: length,
			stt: state
		}	
	}
    

	public static buildUpdateOuterHashPayload(action: string): EntryWithTikAction<OuterHash>[] {

		return this.addOuterActionInEvents<OuterHash>(this.buildOuterHash(), action);
	}

	public static buildNewOuterEventPayload(
		id: string | number, length: number, state: number
	) {
		// todo: мб убрать add и оставить только upsert?
		// разница только в дебаг-отчете, который и без этого корректно сложится
		return this.addOuterActionInEvents(this.buildNewOuterEvent(id, length, state), 'add');
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

	public static async updateOuterConfigHash(): Promise<any> {
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
		dd('uupdateOuterEntries started: ')
		dd(payload)
       
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
		dd('updateOuterEntries result:')
		dd(parseServerResponse(tikResponse))
		
		return parseServerResponse(tikResponse);
	}
}