import createPool from '../../core/db_connection';
import { eventProgress } from "../../core/constants";
import { addEventStateHistory } from "../../db-actions/add-event-state-history";
import { createEvent } from "../../db-actions/create-event";
import { createEventStateHooks } from "../../db-actions/create-event-state-hooks";
import { getAccessibleEvent } from "../../db-actions/get-accessible-event";
import { getEventStateHooks } from "../../db-actions/get-event-state-hooks";
import { upsertEventAccess } from "../../db-actions/upsert-event-access";
import { upsertEventState } from "../../db-actions/upsert-event-state";
import { EventStatus } from "../../types/event-state.types";
import { EventPropsDbItem, toMinProps } from "../../types/event.types";
import { dd } from "../../utils/dd";
import { thisProjectResProp, tikResProp } from "../../utils/getResProp";
import { ConfigManager } from "../config-manager";
import { buildScheduleInfo } from "../event.controller/create-event.ctl";
import { calculateEventStatus } from "../helpers/calculate-event-status.ts";
import { OuterSyncService } from "../outer-sync.service";

export const playOrDuplicateEventCtl = async (userHandler: any, eventId: any) => {
        
    const state = eventProgress.PLAYING; // 1
    const pool = createPool();
    const connection = await pool.getConnection();
    let getAccessibleEventResult,
        calculateEventStatusResult,
        upsertEventStateResult,
        addHistoryResult,
        createdEventId,
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
          
        dd(eventStatus);
        if (eventStatus.status === eventProgress.STOPPED || eventStatus.status === eventProgress.PAUSED) {
            dd('CHANGING STATE (PLAYING) OF EXISTING EVENT')
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

        } else if (eventStatus.status === eventProgress.COMPLETED) {
            dd('DUPLICATING EVENT')
            const name = eventProps.name;
            const length = eventProps.length;
            const type = Number(eventProps.type);
            const accessLevel = 3;

            const { schedule_id, schedule_position } = await buildScheduleInfo(
                connection, 
                eventProps.schedule_id, 
                eventProps.schedule_position
            );
            const base_access = eventProps.base_access_id
            const created_from = `e_${eventId}`;

            const createEventResult = await createEvent(
                connection, name, length, type, userHandler,
                schedule_id, schedule_position,
                base_access, created_from, state
            );
            if (createEventResult.error) {
                throw new Error(createEventResult.error);
            }
            createdEventId = createEventResult.result;

            getEventStateHooksResult = await getEventStateHooks(connection, { eventId });

            createEventStateHookResult = await createEventStateHooks(connection, createdEventId, getEventStateHooksResult.hooks);

            upsertEventAccessResult = await upsertEventAccess(connection, createdEventId, userHandler, accessLevel)
           
            ConfigManager.setConfigHash();
            const hashPayload = OuterSyncService.buildUpdateOuterHashPayload('upsert');
            const eventsPayload = OuterSyncService.buildNewOuterEventPayload(createdEventId, length, state, 'event', 0);
            tikResponse = await OuterSyncService.updateOuterEntries([...hashPayload, ...eventsPayload]);
            await connection.commit();
        } else {
            throw new Error('wrong state of event')
        }

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