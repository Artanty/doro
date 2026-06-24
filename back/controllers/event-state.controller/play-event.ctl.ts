import createPool from '../../core/db_connection';
import { EVENT_TIK_ACTION_PROP, eventProgress } from "../../core/constants";
import { thisProjectResProp, tikResProp } from "../../utils/getResProp";
import { ConfigManager } from "../config-manager";
import { OuterEntry, OuterSyncService } from "../outer-sync.service";
import { PlayEventReq } from '@contracts/event-state.contract';
import { getAccessinleScheduleDb } from '../../db-actions/get-accessible-schedule.db';
import { updateScheduleDb } from '../../db-actions/update-schedule.db';
import { buildOuterEntityId } from '../../utils/buildOuterEntityId';
import { EventUpdate, updateEventsDb } from '../../db-actions/update-events.db';

export const playEventCtl = async (
    userHandler: any, 
    params: PlayEventReq
): Promise<any>  => {
    const state = eventProgress.PLAYING; // 1
    const pool = createPool();
    const connection = await pool.getConnection();
    let getAccessibleScheduleResult,
        eventToPlay,
        eventIdToStop,
        tikEventsPayload: OuterEntry[] = [],
        updateScheduleResult,
        updateEventsPayload: EventUpdate[] = [],
        updateEventsResult,
        tikResponse;
    try {
        await connection.beginTransaction();

        getAccessibleScheduleResult = await getAccessinleScheduleDb(
            connection,
            userHandler,
            params.scheduleId,
            params.eventIdToPlay
        );
        
        if(!getAccessibleScheduleResult.success) {
            throw new Error(getAccessibleScheduleResult.error!);
        }
        eventToPlay = getAccessibleScheduleResult.result.event;
        if (
            getAccessibleScheduleResult.result.active_event_id && 
            getAccessibleScheduleResult.result.is_playing
        ) {
            eventIdToStop = getAccessibleScheduleResult.result.active_event_id;
        }

        updateScheduleResult = await updateScheduleDb(
            connection,
            params.scheduleId,
            {
                active_event_id: params.eventIdToPlay,
                is_playing: true,
            }
        )
        
        if(!updateScheduleResult.success) {
            throw new Error(updateScheduleResult.error!);
        }

        const tikEventToPlay: OuterEntry = {
            id: buildOuterEntityId('event', params.eventIdToPlay),
            [EVENT_TIK_ACTION_PROP]: 'upsert',
            cur: params.playEventPlayhead ?? 0,
            len: eventToPlay.length,
            stt: 1
        }
        tikEventsPayload.push(tikEventToPlay)
     
        if(eventIdToStop){
            const tikEventToStop: OuterEntry = {
                id: buildOuterEntityId('event', eventIdToStop),
                [EVENT_TIK_ACTION_PROP]: 'delete', // add full callback.
            }
            tikEventsPayload.push(tikEventToStop);
        }

        ConfigManager.setConfigHash();
        const hashPayload = OuterSyncService.buildUpdateOuterHashPayload('upsert');
        tikResponse = await OuterSyncService.updateOuterEntries([...hashPayload, ...tikEventsPayload]);

        if (!tikResponse.data.success) {
            throw new Error(tikResponse.data.error!);
        }

        if (eventIdToStop) {
            // doro__e_928
            const receivedDeletedTikEventId = tikResponse.data.stat.deletedItems
            .find(el => el.id ===`doro__e_${eventIdToStop}`);

            if (!receivedDeletedTikEventId) {
                throw new Error('doro prev running event & tik deleted event id mismatch');
            }
            updateEventsPayload.push({ id: eventIdToStop, playhead: receivedDeletedTikEventId.cur})
        }
        
        updateEventsPayload.push({ id: params.eventIdToPlay, playhead: params.playEventPlayhead ?? 0 });
        
        updateEventsResult = await updateEventsDb(connection, updateEventsPayload);

        // addHistoryResult = await addEventStateHistory(connection, eventId, state)
        
        
        await connection.commit();

        return {
            data: {
                success: true,
            },
            debug: {
                [thisProjectResProp()]: {
                    getAccessibleScheduleResult,
                    eventToPlay,
                    eventIdToStop,
                    updateScheduleResult,
                    updateEventsResult,
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
                error: error?.message ?? String(error),
            },
            debug: {
                [thisProjectResProp()]: {
                    getAccessibleScheduleResult,
                    eventToPlay,
                    eventIdToStop,
                    updateScheduleResult,
                    updateEventsPayload,
                    updateEventsResult,
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