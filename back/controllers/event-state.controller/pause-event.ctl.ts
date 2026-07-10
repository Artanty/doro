import { EVENT_TIK_ACTION_PROP } from '../../core/constants';
import createPool from '../../core/db_connection';
import { updateScheduleDb } from '../../db-actions/update-schedule.db';
import { buildOuterEntityId } from '../../utils/buildOuterEntityId';
import { thisProjectResProp, tikResProp } from "../../utils/getResProp";
import { getUTCDatetime } from '../../utils/get-utc-datetime';
import { ConfigManager } from "../config-manager";
import { OuterSyncService, OuterEntry } from "../outer-sync.service";

/**
 * 1. delete tik event, get actual playhead
 * 2. update schedule: is_playing => false, event_playhead => playhead
 */
export const pauseEventCtl = async (  
    userHandler: any, 
    eventId: number,
    scheduleId: number,
    reqHeaders: Record<string, string | string[] | undefined>,
): Promise<any> => {
    const pool = createPool();
    const connection = await pool.getConnection();
    let tikEventsPayload: OuterEntry[] = [],
        tikResponse,
        updateScheduleResult,
        playhead
        ;

    try {
        await connection.beginTransaction();

        const tikEventToDelete: OuterEntry = {
            id: buildOuterEntityId('event', eventId),
            [EVENT_TIK_ACTION_PROP]: 'delete',
        }
        tikEventsPayload.push(tikEventToDelete)

        ConfigManager.setConfigHash({ userHandler, hashType: 'events' });
        ConfigManager.setConfigHash({ userHandler, hashType: 'schedules' });
        const hashPayload = OuterSyncService.buildUpdateOuterHashPayload('upsert', { userHandler, hashType: 'events'});
        const schedulesHashPayload = OuterSyncService.buildUpdateOuterHashPayload('upsert', { userHandler, hashType: 'schedules'});
        tikResponse = await OuterSyncService.updateOuterEntries(
            [...hashPayload, ...schedulesHashPayload, ...tikEventsPayload],
            reqHeaders
        );

        if (!tikResponse.data.success) {
            throw new Error(tikResponse.data.error!);
        }

        const receivedDeletedTikEvent = tikResponse.data.stat.deletedItems
            .find(el => el.id ===`doro__e_${eventId}`);

        playhead = receivedDeletedTikEvent?.cur ?? 0;

        updateScheduleResult = await updateScheduleDb(
            connection,
            scheduleId,
            {
                is_playing: false,
                event_playhead: playhead,
            }
        )
        
        if(!updateScheduleResult.success) {
            throw new Error(updateScheduleResult.error!);
        }

        await connection.execute(
            'UPDATE events SET updated_at = ? WHERE id = ?',
            [getUTCDatetime(), eventId]
        );

        ConfigManager.setConfigHash();
        const hashPayload2 = OuterSyncService.buildUpdateOuterHashPayload('upsert');
        tikResponse = await OuterSyncService.updateOuterEntries(
            hashPayload2,
            reqHeaders
        );

        await connection.commit();
        
        return {
            data: {
                success: true,
            },
            debug: {
                [thisProjectResProp()]: {
                    playhead,
                    updateScheduleResult
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
            debug: {
                [thisProjectResProp()]: {
                    playhead,
                    updateScheduleResult
                },
                [tikResProp()]: {
                    request: tikEventsPayload,
                    response: tikResponse,
                }
            },
            error: error.message
        };
    } finally {
        connection.release();
    }
}