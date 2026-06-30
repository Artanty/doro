import createPool from '../../core/db_connection';
import { EVENT_TIK_ACTION_PROP, eventProgress } from "../../core/constants";
import { thisProjectResProp, tikResProp } from "../../utils/getResProp";
import { ConfigManager } from "../config-manager";
import { OuterEntry, OuterSyncService } from "../outer-sync.service";
import { PlayEventReq } from '@contracts/event-state.contract';
import { getAccessinleScheduleDb, GetAccessibleScheduleEventRes, GetAccessibleScheduleRes } from '../../db-actions/get-accessible-schedule.db';
import { updateScheduleDb } from '../../db-actions/update-schedule.db';
import { buildOuterEntityId } from '../../utils/buildOuterEntityId';
import { EventUpdate, updateEventsDb } from '../../db-actions/update-events.db';
import { Nullable } from '../../utils/utility.types';
import { calculatePlayhead } from './get-running-events.helper';
import { DbActionResult } from '../../types/db-action.types';
import { getEventByIdDb } from '../../db-actions/get-event-by-id.db';
import { GetRunningEventsResItem } from '../../db-actions/get-running-events.db';
import { CtlResult } from '../../types/controller.types';

export type PlayEventResult = CtlResult<{success: boolean}>

export const playEventCtl = async (
    userHandler: any, 
    params: PlayEventReq
): Promise<PlayEventResult> => {
    const state = eventProgress.PLAYING; // 1
    const pool = createPool();
    const connection = await pool.getConnection();
    let getEventByIdResult,
        schedule,
        eventToPlay: GetAccessibleScheduleEventRes,
        eventCalculatedPlayhead: number = -1,
        updatedPlayheadResult,
        eventIdToStop,
        tikEventsPayload: OuterEntry[] = [],
        updateScheduleResult,
        updateEventsPayload: EventUpdate[] = [],
        updateEventsResult,
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
            active_event_id: eventToPlay.schedule_active_event_id
        }

        if (schedule.is_playing &&
            (schedule.active_event_id === eventToPlay.id)
        ) {
            throw new Error(`event ${eventToPlay.id} is already playing`);
        }
        
        eventCalculatedPlayhead = calculatePlayhead(eventToPlay);

        if (eventCalculatedPlayhead === eventToPlay.length) {
            
            if (eventCalculatedPlayhead !== eventToPlay.playhead) {
                updatedPlayheadResult = await updateEventsDb(connection, [
                    { id: eventToPlay.id, playhead: eventCalculatedPlayhead }
                ]);

                const tikEventToDelete: OuterEntry = {
                    id: buildOuterEntityId('event', params.eventIdToPlay),
                    [EVENT_TIK_ACTION_PROP]: 'delete',
                }
                tikEventsPayload.push(tikEventToDelete)
                
                ConfigManager.setConfigHash();
                const hashPayload = OuterSyncService.buildUpdateOuterHashPayload('upsert');
                tikResponse = await OuterSyncService.updateOuterEntries([...hashPayload, ...tikEventsPayload]);

                if (!tikResponse.data.success) {
                    throw new Error(tikResponse.data.error!);
                }
            } else {
                throw new Error(`event ${eventToPlay.id} ended`);
            }
        } else {
            if (
                schedule.active_event_id && 
                schedule.is_playing
            ) {
                eventIdToStop = schedule.active_event_id;
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
                cur: params.playEventPlayhead ?? eventToPlay.playhead,
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
                const receivedDeletedTikEvent = tikResponse.data.stat.deletedItems
                .find(el => el.id ===`doro__e_${eventIdToStop}`);

                if (receivedDeletedTikEvent) {
                    updateEventsPayload.push({ 
                        id: eventIdToStop, 
                        playhead: receivedDeletedTikEvent?.cur 
                    })
                } else {
                    /**
                     * Ситуация, когда @tik неконсистентен с @doro
                     */
                    // throw new Error('doro prev running event & tik deleted event id mismatch');
                }
            }
            
            updateEventsPayload.push({ id: params.eventIdToPlay, playhead: params.playEventPlayhead ?? 0 });
            
            updateEventsResult = await updateEventsDb(connection, updateEventsPayload);
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
                    updatedPlayheadResult,
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