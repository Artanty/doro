import { CtlResult } from "../../types/controller.types";
import createPool from '../../core/db_connection';
import { thisProjectResProp, tikResProp } from '../../utils/getResProp';
import { ConfigManager } from '../config-manager';
import { deleteScheduleDb } from "../../db-actions/delete-schedule.db";
import { OuterEntry, OuterSyncService } from "../outer-sync.service";

export type DeleteScheduleResult = CtlResult<{ success: boolean }>

/**
 * 1. Удалить скедьюл
 * 2. Удалить его доступы
 * 2. удалить его евенты
 * Delete from schedules (ON DELETE CASCADE will handle events and scheduleToUser)
 */

export const deleteScheduleCtl = async (
	userHandler: string,
    scheduleId: number,
    reqHeaders: Record<string, string | string[] | undefined>,
): Promise<DeleteScheduleResult> => {
    const pool = createPool();
	const connection = await pool.getConnection();

    let 
        deleteScheduleResult,
        tikEventsPayload: OuterEntry[] = [],
        tikResponse
        ;
    
    try {
        await connection.beginTransaction();

        deleteScheduleResult = await deleteScheduleDb(
            connection,
            scheduleId,
            userHandler,
        );

        if (!deleteScheduleResult.success) {
            throw new Error(deleteScheduleResult.error!);
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
                success: true,
            },
            debug: {
                [thisProjectResProp()]: {
					deleteScheduleResult
				},
                [tikResProp()]: {
					request: tikEventsPayload,
					response: tikResponse,
				}
            }
        };

    } catch (error: any) { 
		await connection.rollback();
        
        return {
            data: {
                success: false,
            },
            error: error.message,
            debug: {
                [thisProjectResProp()]: {
					deleteScheduleResult
				},
                [tikResProp()]: {
					request: tikEventsPayload,
					response: tikResponse,
				}
            }
        };
	} finally {
		connection.release();
	}
}