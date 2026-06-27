import { EVENT_TIK_ACTION_PROP } from '../../core/constants';
import createPool from '../../core/db_connection';
import { addEventStateHistory, bulkAddEventStateHistory } from "../../db-actions/add-event-state-history";
import { getAccessibleEvents, ACCESS_CASE } from "../../db-actions/get-accessible-event";
import { updateEvent } from '../../db-actions/update-event';
import { EventUpdate, updateEventsDb } from '../../db-actions/update-events.db';
import { updateScheduleDb } from '../../db-actions/update-schedule.db';

import { EventStateResItem } from "../../types/event-state.types";
import { toMinProps, EventPropsDbItem } from "../../types/event.types";
import { buildOuterEntityId } from '../../utils/buildOuterEntityId';
import { formatBulkErrors } from "../../utils/format-bulk-errors.utl";
import { thisProjectResProp, tikResProp } from "../../utils/getResProp";
import { ConfigManager } from "../config-manager";
import { buildTikEvents } from "../helpers/build-tik-events";
import { TikRes, OuterSyncService, OuterEntry } from "../outer-sync.service";

/**
 * 1. update schedule: is_playing => false
 * 2. update event: set playhead
 */
export const pauseEventCtl = async (  
    userHandler: any, 
    eventId: number,
    scheduleId: number,
): Promise<any> => {
    const pool = createPool();
    const connection = await pool.getConnection();
    let tikEventsPayload: OuterEntry[] = [],
        tikResponse,
        updateEventsPayload: EventUpdate[] = [],
        updateEventsResult,
        updateScheduleResult;

    try {
        await connection.beginTransaction();

        const tikEventToDelete: OuterEntry = {
            id: buildOuterEntityId('event', eventId),
            [EVENT_TIK_ACTION_PROP]: 'delete',
        }
        tikEventsPayload.push(tikEventToDelete)

        ConfigManager.setConfigHash();
        const hashPayload = OuterSyncService.buildUpdateOuterHashPayload('upsert');
        tikResponse = await OuterSyncService.updateOuterEntries([...hashPayload, ...tikEventsPayload]);

        if (!tikResponse.data.success) {
            throw new Error(tikResponse.data.error!);
        }

        const receivedDeletedTikEvent = tikResponse.data.stat.deletedItems
            .find(el => el.id ===`doro__e_${eventId}`);

        if (receivedDeletedTikEvent) {
            updateEventsPayload.push({ 
                id: eventId, 
                playhead: receivedDeletedTikEvent?.cur 
            })
        } else {
            /**
             * Ситуация, когда @tik неконсистентен с @doro
             */
            // throw new Error('doro prev running event & tik deleted event id mismatch');
        }

        updateEventsResult = await updateEventsDb(connection, updateEventsPayload);

        updateScheduleResult = await updateScheduleDb(
            connection,
            scheduleId,
            {
                is_playing: false,
            }
        )
        
        if(!updateScheduleResult.success) {
            throw new Error(updateScheduleResult.error!);
        }

        ConfigManager.setConfigHash();
        const hashPayload2 = OuterSyncService.buildUpdateOuterHashPayload('upsert');
        tikResponse = await OuterSyncService.updateOuterEntries(hashPayload2);

        await connection.commit();
        
        return {
            data: {
                success: true,
            },
            debug: {
                [thisProjectResProp()]: {
                    updateEventsPayload,
                    updateEventsResult,
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
                updatedEvents: [],
            },
            debug: {
                [thisProjectResProp()]: {
                    updateEventsPayload,
                    updateEventsResult,
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