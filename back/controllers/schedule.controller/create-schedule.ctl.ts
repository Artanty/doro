import createPool from '../../core/db_connection';
import { createScheduleDb } from '../../db-actions/create-schedule.db';
import { upsertScheduleAccessDb } from '../../db-actions/upsert-schedule-access.db';
import { thisProjectResProp, tikResProp } from '../../utils/getResProp';
import { ConfigManager } from '../config-manager';
import { OuterEntry, OuterSyncService } from '../outer-sync.service';

/**
 * 1. создать schedule
 * 2. создать доступ 
 * 3. обновить\создать configHash для schedules
 * 4. отправить configHash в tik@
 */
export const createScheduleCtl = async (
    userHandler: string,

    name: string,
    active_event_id: number,
	is_playing: boolean
): Promise<any> => {
    const pool = createPool();
    const connection = await pool.getConnection();

    let createSchduleResult,
        upsertScheduleAccessResult,
        tikEventsPayload: OuterEntry[] = [],
        tikResponse
        ;

    try {
        await connection.beginTransaction();

        createSchduleResult = await createScheduleDb(
            connection,
            userHandler,
            name,
            active_event_id, is_playing
        )
        upsertScheduleAccessResult = await upsertScheduleAccessDb(
            connection, 
            createSchduleResult.result, 
            userHandler, 
            3
        );

        await connection.commit();

		ConfigManager.setConfigHash({ userHandler, hashType: 'schedules' }); 

		const schedulesHashPayload = OuterSyncService.buildUpdateOuterHashPayload('upsert', { userHandler, hashType: 'schedules'});
		tikEventsPayload.push(...schedulesHashPayload);

        tikResponse = await OuterSyncService.updateOuterEntries(tikEventsPayload);
        if (!tikResponse.data.success) {
            throw new Error(tikResponse.data.error!);
        }
        
        return {
            data: {
                success: createSchduleResult.result
            },
            debug: {
                [thisProjectResProp()]: {
                    createSchduleResult,
                    upsertScheduleAccessResult
                },
                [tikResProp()]: {
                    tikEventsPayload,
                    tikResponse
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
                    createSchduleResult,
                    upsertScheduleAccessResult
                },
                [tikResProp()]: {
                    tikEventsPayload,
                    tikResponse
                }
            }
        };
    } finally {
        connection.release();
    }
}