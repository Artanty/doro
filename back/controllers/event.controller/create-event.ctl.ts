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
import { createEvent as createEventDb } from '../../db-actions/create-event';

export const createEventCtl = async (
	name: string, 
	length: number, 
	type: number, 
	userHandler: string,
	base_access: number,
	state: number,
	hooks: CreateEventStateHookParams[],
	created_from: string
) => {
	const pool = createPool();
	const connection = await pool.getConnection();

	let createEventResult,
		createEventStateHookResult,
		upsertEventAccessResult,
		upsertEventStateResult;
	try {
		await connection.beginTransaction();
		
		createEventResult = await createEventDb(connection, name, length, type, userHandler, base_access, created_from);
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
		const eventsPayload = OuterSyncService.buildNewOuterEventPayload(eventId, length, state);
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