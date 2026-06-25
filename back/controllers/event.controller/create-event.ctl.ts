import createPool from '../../core/db_connection';
import { addEventStateHistory } from '../../db-actions/add-event-state-history';
import { ConfigManager } from '../config-manager';
import { OuterSyncService } from '../outer-sync.service';
import { createEventDb } from '../../db-actions/create-event.db';
import { buildScheduleInfo } from '../helpers/build-schedule-info';
import { thisProjectResProp } from '../../utils/getResProp';
import { CreateEventReq } from '@contracts/event.contract';

type CreateEventCtlProps = CreateEventReq & { userHandler: string }

export const createEventCtl = async (props: CreateEventCtlProps): Promise<{ data: any, debug: any }> => {
	const { 
			userHandler,
			name, length, playhead, is_rest, 
			schedule_id,
			hooks, 
			is_playing
		} = props;

	const pool = createPool();
	const connection = await pool.getConnection();

	let createEventResult,
		createEventStateHookResult,
		upsertScheduleAccessResult,
		addHistoryResult
		;
	try {
		await connection.beginTransaction();

		const schedule_position = 
			props.schedule_position ?? 
			(await buildScheduleInfo(connection, schedule_id)).schedule_position;

		createEventResult = await createEventDb(
			connection,
			name, length, playhead, is_rest, 
			schedule_id, schedule_position,
		);
		if (createEventResult.error) {
			throw new Error(createEventResult.error);
		}
		const eventId = createEventResult.result;

		// createEventStateHookResult = await createEventStateHooks(connection, eventId, hooks);

		addHistoryResult = await addEventStateHistory(connection, eventId, is_playing, playhead)
			
		/**
		 * Нужно чтобы doro@web подтянул новое cобытие.
		 * Для этого обновляем хэш, который doro@web впоследствии получит от tik@web
		 * */
		ConfigManager.setConfigHash();
		const entitiesToUpdate: any[] = [];
		const hashPayload = OuterSyncService.buildUpdateOuterHashPayload('upsert');
		entitiesToUpdate.push(...hashPayload)
		/**
		 * Стейт события (ecли is_playing === true) нужно передать в tik@, чтобы отобразился прогресс.
		 * Передаем обе сущности в одном запросе.
		 * */
		if (is_playing) {
			const eventsPayload = OuterSyncService.buildNewOuterEventPayload(eventId, length, Number(is_playing), 'event');
			entitiesToUpdate.push(...eventsPayload)
		}
		await OuterSyncService.updateOuterEntries(entitiesToUpdate);
		
		await connection.commit();
		return {
			data: {
				id: eventId
			},
			debug: {
				[thisProjectResProp()]: {
					createEventResult,
					createEventStateHookResult,
					upsertScheduleAccessResult,
					addHistoryResult
				},
			}
		};
	} catch (error) { 
		console.log(error)
		await connection.rollback();
		return {
			data: null,
			debug: {
				[thisProjectResProp()]: {
					createEventResult,
					createEventStateHookResult,
					upsertScheduleAccessResult,
					addHistoryResult
				},
			}
		};
	} finally {
		connection.release();
	}
}