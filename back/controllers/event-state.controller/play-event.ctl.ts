import createPool from '../../core/db_connection';
import { EVENT_TIK_ACTION_PROP } from "../../core/constants";
import { thisProjectResProp, tikResProp } from "../../utils/getResProp";
import { ConfigManager } from "../config-manager";
import { OuterEntry, OuterSyncService } from "../outer-sync.service";
import { PlayEventReq } from '@contracts/event-state.contract';
import { updateScheduleDb } from '../../db-actions/update-schedule.db';
import { buildOuterEntityId } from '../../utils/buildOuterEntityId';
import { getEventByIdDb } from '../../db-actions/get-event-by-id.db';
import { GetRunningEventsResItem } from '../../db-actions/get-running-events.db';
import { CtlResult } from '../../types/controller.types';
import { getUTCDatetime } from '../../utils/get-utc-datetime';

export type PlayEventResult = CtlResult<{success: boolean}>

export const playEventCtl = async (
    userHandler: any, 
    params: PlayEventReq
): Promise<PlayEventResult> => {
    const pool = createPool();
    const connection = await pool.getConnection();
    let getEventByIdResult,
        schedule,
        eventToPlay,
        eventCalculatedPlayhead: number = -1,
        eventIdToStop,
        tikEventsPayload: OuterEntry[] = [],
        updateScheduleResult,
        tikResponse
        ;
    try {
        await connection.beginTransaction();
        
        getEventByIdResult = await getEventByIdDb(
            connection,
            userHandler,
            params.eventIdToPlay
        );
        if(!getEventByIdResult.success) {
            throw new Error(getEventByIdResult.error!);
        }

        const eventToPlay: GetRunningEventsResItem = getEventByIdResult.result[0];

        schedule = { 
            is_playing: eventToPlay.schedule_is_playing,
            active_event_id: eventToPlay.schedule_active_event_id,
            event_playhead: eventToPlay.schedule_event_playhead,
        }

        if (schedule.is_playing &&
            (schedule.active_event_id === eventToPlay.id)
        ) {
            throw new Error(`event ${eventToPlay.id} is already playing`);
        }
        
        eventCalculatedPlayhead = eventToPlay.id === schedule.active_event_id
            ? (schedule.event_playhead ?? 0)
            : 0;

        if (eventCalculatedPlayhead >= eventToPlay.length) {
            throw new Error(`event ${eventToPlay.id} ended`);
        }

        if (schedule.active_event_id && schedule.is_playing) {
            eventIdToStop = schedule.active_event_id;
        }

        updateScheduleResult = await updateScheduleDb(
            connection,
            params.scheduleId,
            {
                active_event_id: params.eventIdToPlay,
                is_playing: true,
                event_playhead: eventCalculatedPlayhead,
            }
        )

        if (!updateScheduleResult.success) {
            throw new Error(updateScheduleResult.error!);
        }

        await connection.execute(
            'UPDATE events SET updated_at = ? WHERE id = ?',
            [getUTCDatetime(), params.eventIdToPlay]
        );

        tikEventsPayload.push({
            id: buildOuterEntityId('event', params.eventIdToPlay),
            [EVENT_TIK_ACTION_PROP]: 'upsert',
            cur: eventCalculatedPlayhead,
            len: eventToPlay.length,
            stt: 1,
        })

        if (eventIdToStop) {
            tikEventsPayload.push({
                id: buildOuterEntityId('event', eventIdToStop),
                [EVENT_TIK_ACTION_PROP]: 'delete',
            });
        }

        ConfigManager.setConfigHash({ userHandler, hashType: 'events' });
        ConfigManager.setConfigHash({ userHandler, hashType: 'schedules' });
        const hashPayload = OuterSyncService.buildUpdateOuterHashPayload('upsert');
        const schedulesHashPayload = OuterSyncService.buildUpdateOuterHashPayload('upsert', { userHandler, hashType: 'schedules'});
        tikResponse = await OuterSyncService.updateOuterEntries([...hashPayload, ...schedulesHashPayload, ...tikEventsPayload]);

        if (!tikResponse.data.success) {
            throw new Error(tikResponse.data.error!);
        }

        // addHistoryResult = await addEventStateHistory(connection, eventId, state)
        
        await connection.commit();

        return {
            data: {
                success: true,
            },
            debug: {
                [thisProjectResProp()]: {
                    getEventByIdResult,
                    schedule,
                    eventToPlay,
                    eventCalculatedPlayhead,
                    eventIdToStop,
                    updateScheduleResult,
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
                    getEventByIdResult,
                    eventToPlay: eventToPlay!,
                    schedule,
                    eventCalculatedPlayhead,
                    eventIdToStop,
                    updateScheduleResult,
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