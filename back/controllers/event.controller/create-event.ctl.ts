import createPool from '../../core/db_connection';
import axios from 'axios';
import dotenv from 'dotenv';
import { dd } from '../../utils/dd';
import { thisProjectResProp } from '../../utils/getResProp';
import { CreateEventStateHookParams, createEventStateHooks } from '../../db-actions/create-event-state-hooks';
import { upsertEventAccess } from '../../db-actions/upsert-event-access';
import { upsertEventState } from '../../db-actions/upsert-event-state';
import { ConfigManager } from '../config-manager';
import { OuterSyncService } from '../outer-sync.service';
import { createEvent as createEventDb, DbActionResult } from '../../db-actions/create-event';
import { BASE_SCHEDULE_ID } from '../../core/constants';
import { GetLastPositionResult, getLastSchedulePosition } from '../../db-actions/get-last-schedule-position';

export const createEventCtl = async (
	name: string, 
	length: number, 
	type: number, 
	userHandler: string,
	base_access: number,
	state: number,
	hooks: CreateEventStateHookParams[],
	created_from: string,
	scheduleId?: number, 
	schedulePosition?: number
) => {
	const pool = createPool();
	const connection = await pool.getConnection();

	let createEventResult,
		createEventStateHookResult,
		upsertEventAccessResult,
		upsertEventStateResult;
	try {
		await connection.beginTransaction();

		const { schedule_id, schedule_position } = await buildScheduleInfo(connection, scheduleId, schedulePosition);
		
		createEventResult = await createEventDb(
			connection, name, length, type, userHandler,
			schedule_id, schedule_position,
			base_access, created_from
		);
		if (createEventResult.error) {
			throw new Error(createEventResult.error);
		}
		const eventId = createEventResult.result;

		createEventStateHookResult = await createEventStateHooks(connection, eventId, hooks);

		upsertEventAccessResult = await upsertEventAccess(connection, eventId, userHandler, 3);

		upsertEventStateResult = await upsertEventState(connection, eventId, state) // todo add false return if no updated
			
		/**
		 * Нужно чтобы doro@web подтянул новое cобытие.
		 * Для этого обновляем хэш, который doro@web впоследствии получит от tik@web
		 * */
		ConfigManager.setConfigHash();
		/**
		 * Стейт события нужно передать в tik@, чтобы отобразился прогресс.
		 * Передаем обе сущности в одном запросе.
		 * v2: проверять, нужно ли сейчас отправлять это событие или оно не актуальное.
		 * */
		const hashPayload = OuterSyncService.buildUpdateOuterHashPayload('upsert');
		const eventsPayload = OuterSyncService.buildNewOuterEventPayload(eventId, length, state, 'event');
		await OuterSyncService.updateOuterEntries([...hashPayload, ...eventsPayload]);

		await connection.commit();
		return {
			data: {
				id: eventId
			},
			debug: {
				[thisProjectResProp()]: {
					createEventResult,
					createEventStateHookResult,
					upsertEventAccessResult,
					upsertEventStateResult,
						
				},
			}
		};
	} catch (error) { 
		console.log(error)
		await connection.rollback();
		throw error;
	} finally {
		connection.release();
	}
}

export interface ScheduleInfo {
	schedule_id: number, 
	schedule_position: number
}
export const buildScheduleInfo = async (connection, schedule_id?: number, schedule_position?: number): Promise<ScheduleInfo> => {

	if (!schedule_id) {
		schedule_id = BASE_SCHEDULE_ID;
	}
	const lastPositionResult: DbActionResult<GetLastPositionResult> = await getLastSchedulePosition(connection, schedule_id);
	
	if (!lastPositionResult.success) throw new Error('buildScheduleInfo error');

	return {
		schedule_id,
		schedule_position: lastPositionResult.result!.last_position + 1
	}
}