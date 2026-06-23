import createPool from '../../core/db_connection';
import { EVENT_TIK_ACTION_PROP, eventProgress } from "../../core/constants";

import { thisProjectResProp, tikResProp } from "../../utils/getResProp";
import { ConfigManager } from "../config-manager";
import { OuterEntry, OuterSyncService } from "../outer-sync.service";
import { PlayEventReq } from '@contracts/event-state.contract';
import { dd } from '../../utils/dd';
import { getAccessinleScheduleDb } from '../../db-actions/get-accessible-schedule.db';
import { updateScheduleDb } from '../../db-actions/update-schedule.db';
import { buildOuterEntityId } from '../../utils/buildOuterEntityId';
import { updateEventsDb } from '../../db-actions/update-events.db';

export const playEventCtl = async (
    userHandler: any, 
    params: PlayEventReq
) => {
    const state = eventProgress.PLAYING; // 1
    const pool = createPool();
    const connection = await pool.getConnection();
    let getAccessibleScheduleResult,
        eventToPlay,
        eventIdToStop,
        tikEventsPayload: OuterEntry[] = [],
        updateScheduleResult,
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
        dd(getAccessibleScheduleResult)
        
        if(!getAccessibleScheduleResult.success) {
            throw new Error(getAccessibleScheduleResult.error!);
        }
        eventToPlay = getAccessibleScheduleResult.result.event;
        if (
            getAccessibleScheduleResult.result.active_event_id && 
            getAccessibleScheduleResult.result.is_playing
        ) {
            dd('go tik')
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
        dd(updateScheduleResult)
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

        updateEventsResult = await updateEventsDb(connection, [
            { id: params.eventIdToPlay, playhead: params.playEventPlayhead ?? 0 },
            { id: eventIdToStop, playhead:  6 }, // todo receive from tik current playhead!!!
        ])

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
        console.log(error)
        await connection.rollback();
        throw new Error('play Event error: ' + (error?.message ?? error));
    } finally {
        connection.release();
    }
}