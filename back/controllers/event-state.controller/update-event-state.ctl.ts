import createPool from '../../core/db_connection';
import { bulkAddEventStateHistory } from "../../db-actions/add-event-state-history";
import { getAccessibleEvents, ACCESS_CASE } from "../../db-actions/get-accessible-event";
import { UpsertEventStateItem, bulkUpsertEventState } from '../../db-actions/upsert-event-state';
import { EventStateResItem } from "../../types/event-state.types";
import { toMinProps, EventPropsDbItem } from "../../types/event.types";
import { formatBulkErrors } from "../../utils/format-bulk-errors.utl";
import { thisProjectResProp, tikResProp } from "../../utils/getResProp";
import { ConfigManager } from "../config-manager";
import { buildTikEvents } from "../helpers/build-tik-events";
import { TikRes, OuterSyncService } from "../outer-sync.service";

export const updateEventStateCtl = async (  
    userHandler: any, 
    eventStates: UpsertEventStateItem[],
): Promise<any> => {
    // debugger;
    const pool = createPool();
    const connection = await pool.getConnection();
    let getAccessibleEventResult,
        upsertStateResult,
        addEventStateHistoryResult,
        tikEntriesPayload,
        tikResponse!: TikRes;
    try {
        await connection.beginTransaction();

        const idsToCheck = eventStates.map(e => e.eventId)
        getAccessibleEventResult = await getAccessibleEvents(connection, idsToCheck, userHandler, ACCESS_CASE.UPDATE);
        if (!getAccessibleEventResult.success) {
            throw new Error(formatBulkErrors(getAccessibleEventResult));
        }

        upsertStateResult = await bulkUpsertEventState(connection, eventStates) // todo add false return if no updated
            
        if (!upsertStateResult.success) {
            throw new Error('state is not updated');
        }
            
        addEventStateHistoryResult = await bulkAddEventStateHistory(connection, eventStates)
        // debugger;
        const eventsArr = Array.from(getAccessibleEventResult.results.values());
        const minProps = eventsArr.map(e => toMinProps(e as EventPropsDbItem));
        // const eventProps: EventPropsDbItem = getAccessibleEventResult.results.get(eventId);
            
        // const minProps = toMinProps(eventProps);
        const updatedEventsWithStatus: EventStateResItem[] = await buildTikEvents(connection, minProps);
        await connection.commit();

        ConfigManager.setConfigHash();
        const hashPayload = OuterSyncService.buildUpdateOuterHashPayload('upsert');
        const eventsPayload = OuterSyncService.addOuterActionInEvents(updatedEventsWithStatus, 'update');
        tikEntriesPayload = [...hashPayload, ...eventsPayload]
        tikResponse = await OuterSyncService.updateOuterEntries(tikEntriesPayload);
            
        return {
            data: {
                success: true,
            },
            debug: {
                [thisProjectResProp()]: {
                    getAccessibleEventResult,
                    upsertStateResult,
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
                    upsertStateResult,
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