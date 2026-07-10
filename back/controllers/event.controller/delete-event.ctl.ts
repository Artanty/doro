import createPool from '../../core/db_connection';
import { thisProjectResProp, tikResProp } from '../../utils/getResProp';
import { ConfigManager } from '../config-manager';
import { OuterEntry, OuterSyncService } from '../outer-sync.service';
import { deleteEventDb } from '../../db-actions/delete-event.db';
import { buildOuterEntityId } from '../../utils/buildOuterEntityId';
import { getEventForDeleteDb, GetEventForDeleteResItem } from '../../db-actions/get-event-for-delete.db';
import { DbActionResult } from '../../types/db-action.types';
import { deleteScheduleDb } from '../../db-actions/delete-schedule.db';
import { EVENT_TIK_ACTION_PROP } from '../../core/constants';
import { updateScheduleDb } from '../../db-actions/update-schedule.db';
import { CtlResult } from '../../types/controller.types';

/**
 * 1. получить event & schedule
 * 
 * 2. Если этот ивент последний в schedule 
 * 2.1 - удалить schedule
 * Если нет:
 * 2.1 - проверить, является ли он активным (и идущим)
 * если да - is_playing = false; active_event-Id = -1.
 * если ивент не активный - ничего не делаем со schedules.
 * 
 * 3. Удалить event.
 * 
 * 4. Если это был активный идущий ивент - 
 * Отправить в @tik delete. 
 * Ответ не нужен, здесь же обновляем configHash.
 * 
 * TODO: сделать настройку - при удалении последнего события:
 * 1. спрашивать про удаление расписания
 * 2. удалять расписание автоматически
 */
export type DeleteEventResult = CtlResult<{success: boolean, deletedSchedule?: number}>

export const deleteEventCtl = async (
	eventId: number, 
	userHandler: string,
	reqHeaders: Record<string, string | string[] | undefined>,
): Promise<DeleteEventResult>  => {
	const pool = createPool();
	const connection = await pool.getConnection();

	let 
		getEventForDeleteResult: DbActionResult<GetEventForDeleteResItem[]>,
		totalEvents: number = 0,
		deleteScheduleResult,
		updateScheduleResult,
		deleteEventResult,
		tikEventsPayload: OuterEntry[] = [],
		tikResponse
		;
	try {
		await connection.beginTransaction();

		getEventForDeleteResult = await getEventForDeleteDb(
			connection,
			userHandler,
			eventId
		);
		if(!getEventForDeleteResult.success) {
			throw new Error(getEventForDeleteResult.error!);
		}
		const event = getEventForDeleteResult.result![0];

		totalEvents = event.schedule_total_events;
		
		if (totalEvents === 1) {
			deleteScheduleResult = await deleteScheduleDb(connection, event.schedule_id);
		}
		
		if (event.is_active_event) {
			updateScheduleResult = await updateScheduleDb(
				connection,
				event.schedule_id,
				{
					active_event_id: -1,
        			is_playing: false
				}
			)

			const tikEventToStop: OuterEntry = {
				id: buildOuterEntityId('event', eventId),
				[EVENT_TIK_ACTION_PROP]: 'delete',
			}
			tikEventsPayload.push(tikEventToStop);
		}
		
		deleteEventResult = await deleteEventDb(connection, eventId);
		if (!deleteEventResult.success) {
			throw new Error(deleteEventResult.error!);
		}

		await connection.commit();

		ConfigManager.setConfigHash({ userHandler, hashType: 'events' });
		ConfigManager.setConfigHash({ userHandler, hashType: 'schedules' }); 
		const eventsHashPayload = OuterSyncService.buildUpdateOuterHashPayload('upsert', { userHandler, hashType: 'events'});
		const schedulesHashPayload = OuterSyncService.buildUpdateOuterHashPayload('upsert', { userHandler, hashType: 'schedules'});
		tikEventsPayload.push(...eventsHashPayload, ...schedulesHashPayload);

		tikResponse = await OuterSyncService.updateOuterEntries(
			tikEventsPayload,
			reqHeaders 
		);
		
		if (!tikResponse.data.success) {
            throw new Error(tikResponse.data.error!);
        }
		
		return {
			data: {
				success: deleteEventResult?.success,
				deletedSchedule: deleteScheduleResult?.success,
			},
			debug: {
				[thisProjectResProp()]: {
					getEventForDeleteResult,
					totalEvents,
					deleteScheduleResult,
					updateScheduleResult,
					deleteEventResult,
				},
				[tikResProp()]: {
					request: tikEventsPayload,
					response: tikResponse,
				}
			}
		}
	} catch (error: any) { 
		await connection.rollback();
        
        return {
            data: {
                success: false,
            },
            error: error.message,
            debug: {
                [thisProjectResProp()]: {
					getEventForDeleteResult: getEventForDeleteResult!,
					totalEvents,
					deleteScheduleResult,
					updateScheduleResult,
					deleteEventResult,
				},
				[tikResProp()]: {
					request: tikEventsPayload,
					response: tikResponse
				}
            }
        };
	} finally {
		connection.release();
	}
}