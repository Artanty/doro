import { CreateFullScheduleReq } from '@contracts/schedule.contracts';
import createPool from '../../core/db_connection';
import { createScheduleDb } from '../../db-actions/create-schedule.db';
import { upsertScheduleAccessDb } from '../../db-actions/upsert-schedule-access.db';
import { thisProjectResProp, tikResProp } from '../../utils/getResProp';
import { ConfigManager } from '../config-manager';
import { OuterEntry, OuterSyncService } from '../outer-sync.service';
import { createEventsSequenceDb } from '../../db-actions/create-events-sequence.db';

/**
 * 1. создать schedule
 * 2. создать доступ 
 * 3. создать события
 * 3. обновить\создать configHash для schedules и для events
 * 4. отправить configHash в tik@
 */
export const createFullScheduleCtl = async (
    userHandler: string,
    
    config: CreateFullScheduleReq
): Promise<any> => {
    const pool = createPool();
    const connection = await pool.getConnection();
    const now = new Date();
    const scheduleName = now.toTimeString().slice(0, 5);
    const active_event_id = -1;
    const is_playing = false;

    let createScheduleResult,
        upsertScheduleAccessResult,
        createEventsSequenceResult,
        tikEventsPayload: OuterEntry[] = [],
        tikResponse
        ;

    try {
        await connection.beginTransaction();

        createScheduleResult = await createScheduleDb(
            connection,
            userHandler,
            scheduleName,
            active_event_id,
            is_playing
        )
        if (!createScheduleResult.success) {
            throw new Error(createScheduleResult.error)
        }
        upsertScheduleAccessResult = await upsertScheduleAccessDb(
            connection, 
            createScheduleResult.result, 
            userHandler, 
            3
        );
        if (!upsertScheduleAccessResult.success) {
            throw new Error(upsertScheduleAccessResult.error)
        }

        const scheduleId = createScheduleResult.result;
        
        createEventsSequenceResult = await createEventsSequenceDb(
            connection,
            scheduleId,
            config,
        );
        if (!createEventsSequenceResult.success) {
            throw new Error(createEventsSequenceResult.error)
        }

        await connection.commit();

		ConfigManager.setConfigHash({ userHandler, hashType: 'events' });
		ConfigManager.setConfigHash({ userHandler, hashType: 'schedules' }); 
		const eventsHashPayload = OuterSyncService.buildUpdateOuterHashPayload('upsert', { userHandler, hashType: 'events'});
		const schedulesHashPayload = OuterSyncService.buildUpdateOuterHashPayload('upsert', { userHandler, hashType: 'schedules'});
		tikEventsPayload.push(...eventsHashPayload, ...schedulesHashPayload);

		tikResponse = await OuterSyncService.updateOuterEntries(tikEventsPayload);

        if (!tikResponse.data.success) {
            throw new Error(tikResponse.data.error!);
        }
        
        return {
            data: {
                scheduleId: createScheduleResult.result
            },
            debug: {
                [thisProjectResProp()]: {
                    createScheduleResult,
                    upsertScheduleAccessResult,
                    createEventsSequenceResult,
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
                    createScheduleResult,
                    upsertScheduleAccessResult,
                    createEventsSequenceResult,
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