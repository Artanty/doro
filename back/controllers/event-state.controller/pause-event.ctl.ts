import createPool from '../../core/db_connection';
import { addEventStateHistory, bulkAddEventStateHistory } from "../../db-actions/add-event-state-history";
import { getAccessibleEvents, ACCESS_CASE } from "../../db-actions/get-accessible-event";
import { updateEvent } from '../../db-actions/update-event';

import { EventStateResItem } from "../../types/event-state.types";
import { toMinProps, EventPropsDbItem } from "../../types/event.types";
import { formatBulkErrors } from "../../utils/format-bulk-errors.utl";
import { thisProjectResProp, tikResProp } from "../../utils/getResProp";
import { ConfigManager } from "../config-manager";
import { buildTikEvents } from "../helpers/build-tik-events";
import { TikRes, OuterSyncService } from "../outer-sync.service";

export const pauseEventCtl = async (  
    userHandler: any, 
    eventId: number,
    eventState: number,
): Promise<any> => {
    const pool = createPool();
    const connection = await pool.getConnection();
    let getAccessibleEventResult,
        updateEventResult,
        addEventStateHistoryResult,
        tikEntriesPayload,
        tikResponse!: TikRes;
    try {
        await connection.beginTransaction();

        getAccessibleEventResult = await getAccessibleEvents(connection, [eventId as any], userHandler, ACCESS_CASE.UPDATE);
        if (!getAccessibleEventResult.success) {
            throw new Error(formatBulkErrors(getAccessibleEventResult));
        }

        updateEventResult = await updateEvent(connection, eventId, { event_state_id: eventState }, 'mock');
            
        if (!updateEventResult.success) {
            throw new Error('state is not updated');
        }
        // debugger;
        addEventStateHistoryResult = await addEventStateHistory(connection, eventId, eventState);
        
        const eventsArr = Array.from(getAccessibleEventResult.results.values());
        const minProps = eventsArr.map(e => toMinProps(e as EventPropsDbItem));
        
        const updatedEventsWithStatus: EventStateResItem[] = await buildTikEvents(connection, minProps);
        
        await connection.commit();

        ConfigManager.setConfigHash();
        const hashPayload = OuterSyncService.buildUpdateOuterHashPayload('upsert');
        const eventsPayload = OuterSyncService.addOuterActionInEvents(updatedEventsWithStatus, 'upsert');
        tikEntriesPayload = [...hashPayload, ...eventsPayload]
        tikResponse = await OuterSyncService.updateOuterEntries(tikEntriesPayload);
            
        return {
            data: {
                success: true,
            },
            debug: {
                [thisProjectResProp()]: {
                    getAccessibleEventResult,
                    updateEventResult,
                    addEventStateHistoryResult,
                },
                [tikResProp()]: {
                    request: tikEntriesPayload,
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
                    getAccessibleEventResult,
                    updateEventResult,
                    addEventStateHistoryResult,
                },
                [tikResProp()]: {
                    request: tikEntriesPayload,
                    response: tikResponse,
                }
            },
            error: error.message
        };
    } finally {
        connection.release();
    }
}