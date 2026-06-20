import createPool from '../../core/db_connection';
import { eventProgress } from "../../core/constants";
import { addEventStateHistory } from "../../db-actions/add-event-state-history";

import { getAccessibleEvent } from "../../db-actions/get-accessible-event";
import { upsertEventState } from "../../db-actions/upsert-event-state";
import { EventStatus } from "../../types/event-state.types";
import { EventPropsDbItem, toMinProps } from "../../types/event.types";
import { thisProjectResProp, tikResProp } from "../../utils/getResProp";
import { ConfigManager } from "../config-manager";
import { calculateEventStatus } from "../helpers/calculate-event-status";
import { OuterSyncService } from "../outer-sync.service";
import { updateScheduleActiveEventDb } from '../../db-actions/update-schedule-active-event';

export const playOrDuplicateEventCtl = async (
    userHandler: any, 
    eventId: any,
    scheduleId: number,
) => {
    const state = eventProgress.PLAYING; // 1
    const pool = createPool();
    const connection = await pool.getConnection();
    let getAccessibleEventResult,
        calculateEventStatusResult,
        upsertEventStateResult,
        addHistoryResult,
        createdEventId,
        updateScheduleActiveEventResult,
        getEventStateHooksResult,
        createEventStateHookResult,
        upsertEventAccessResult,
        tikResponse;
    try {
        await connection.beginTransaction();

        getAccessibleEventResult = await getAccessibleEvent(connection, eventId, userHandler, 1);
        if (!getAccessibleEventResult.success) {
            throw new Error(getAccessibleEventResult.error!);
        }

        const eventProps: EventPropsDbItem = getAccessibleEventResult.result;
        calculateEventStatusResult = await calculateEventStatus(connection, toMinProps(eventProps));
        if (!calculateEventStatusResult.success) {
            throw new Error(calculateEventStatusResult.error!);
        }

        const eventStatus: EventStatus = calculateEventStatusResult.result!

        updateScheduleActiveEventResult = await updateScheduleActiveEventDb(connection, eventId, scheduleId);
        if (!updateScheduleActiveEventResult.success) {
            throw new Error(updateScheduleActiveEventResult.error!)
        }
        upsertEventStateResult = await upsertEventState(connection, eventId, state);
        if (!upsertEventStateResult.success) {
            throw new Error(upsertEventStateResult.error!)
        }
        addHistoryResult = await addEventStateHistory(connection, eventId, state)
        ConfigManager.setConfigHash();
        const hashPayload = OuterSyncService.buildUpdateOuterHashPayload('upsert');
        const eventsPayload = OuterSyncService.buildNewOuterEventPayload(eventId, eventProps.length, state, 'event', eventStatus.currentSeconds);
        tikResponse = await OuterSyncService.updateOuterEntries([...hashPayload, ...eventsPayload]);
        await connection.commit();

        return {
            data: {
                success: true,
                isDuplicate: eventStatus.status === eventProgress.COMPLETED,
                actualEventId: eventProgress.COMPLETED ? createdEventId : eventId, //eventS!
            },
            debug: {
                [thisProjectResProp()]: {
                    getAccessibleEventResult,
                    calculateEventStatusResult,
                    isDuplicate: eventStatus.status === eventProgress.COMPLETED,
                    actualEventId: eventProgress.COMPLETED ? createdEventId : eventId, //eventS!
                       
                    upsertEventStateResult,
                    addHistoryResult,
                    upsertEventAccessResult,
                    getEventStateHooksResult,
                    createEventStateHookResult,
                    updateScheduleActiveEventResult,
                },
                [tikResProp()]: tikResponse
            }
        };
    } catch (error: any) { 
        console.log(error)
        await connection.rollback();
        throw new Error('playOrDuplicateEvent error: ' + (error?.message ?? error));
    } finally {
        connection.release();
    }
}