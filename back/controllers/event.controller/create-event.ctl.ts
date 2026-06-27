import createPool from '../../core/db_connection';
import { addEventStateHistory } from '../../db-actions/add-event-state-history';
import { ConfigManager } from '../config-manager';
import { OuterSyncService } from '../outer-sync.service';
import { createEventDb } from '../../db-actions/create-event.db';
import { buildScheduleInfo } from '../helpers/build-schedule-info';
import { thisProjectResProp } from '../../utils/getResProp';
import { CreateEventReq } from '@contracts/event.contract';
import { CtlResult } from '../../types/controller.types';
import { Nullable } from '../../utils/utility.types';
import { dd } from '../../utils/dd';
import { PlayEventReq } from '@contracts/event-state.contract';
import { playEventCtl, PlayEventResult } from '../event-state.controller/play-event.ctl';

type CreateEventCtlProps = CreateEventReq & { userHandler: string };
type CreateStoppedEventResult = CtlResult<Nullable<{id: number}>>

type CreateEventCtlResult = CtlResult<Nullable<{ id: number, is_playing: boolean }>>

export const createStoppedEvent = async (
	userHandler: any,
	props: CreateEventCtlProps
): Promise<CreateStoppedEventResult> => {
	const { 
			
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
		addHistoryResult;
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

		// addHistoryResult = await addEventStateHistory(connection, eventId, is_playing, playhead)
			
		/**
		 * Нужно чтобы doro@web подтянул новое cобытие.
		 * Для этого обновляем хэш, который doro@web впоследствии получит от tik@web
		 * 
		 * Не делаем этого, если is_playing, чтобы дважды не обновлять все клиенты.
		 * Можно использовать отдельно для содания остановленных ивентов.
		 * */
		if (!is_playing) {
			ConfigManager.setConfigHash();
			const entitiesToUpdate: any[] = [];
			const hashPayload = OuterSyncService.buildUpdateOuterHashPayload('upsert');
			entitiesToUpdate.push(...hashPayload)
			await OuterSyncService.updateOuterEntries(entitiesToUpdate);
		}
		
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
	} catch (error: any) { 
		console.log(error)
		await connection.rollback();
		return {
			error: error?.message,
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

export const createEventCtl = async (
	userHandler: any,
	props: CreateEventCtlProps
): Promise<CreateEventCtlResult> => {
	let
		createStoppedEventResult: CreateStoppedEventResult,
		playEventResult: PlayEventResult;

	createStoppedEventResult = await createStoppedEvent(userHandler, props);
	
	if (!createStoppedEventResult.error && props.is_playing) {	
		const playEventProps: PlayEventReq = {
			scheduleId: props.schedule_id,
			eventIdToPlay: createStoppedEventResult.data!.id,
			playEventPlayhead: props.playhead
		}
		playEventResult = await playEventCtl(userHandler, playEventProps)
	}

	return {
		data: {
			id: createStoppedEventResult.data!.id,
			is_playing: playEventResult! ? playEventResult.data.success : false,
		},
		debug: {
			create: createStoppedEventResult.debug,
			play: playEventResult! ? playEventResult.debug : undefined,
		},
		error: createStoppedEventResult.error
		? {
			create: createStoppedEventResult.error,
			play: playEventResult! ? playEventResult.error : undefined,
		}
		: undefined
	}
}