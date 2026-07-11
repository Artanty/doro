import createPool from '../../core/db_connection';
import { batchUpdateScheduleDb, BatchUpdateScheduleItem } from '../../db-actions/update-schedule.db';
import { EventStateResItem } from "../../types/event-state.types";
import { thisProjectResProp, tikResProp } from "../../utils/getResProp";
import { ConfigManager } from "../config-manager";
import { buildTikEvents } from "../helpers/build-tik-events";
import { TikRes, OuterSyncService } from "../outer-sync.service";

export const updateEventStateCtl = async (
    userHandler: any,
    scheduleUpdates: BatchUpdateScheduleItem[],
    reqHeaders,
): Promise<any> => {

    const pool = createPool();
    const connection = await pool.getConnection();
    let 
        updateSchedulesResult,
        tikEntriesPayload,
        tikResponse!: TikRes;
    try {
        await connection.beginTransaction();

        updateSchedulesResult = await batchUpdateScheduleDb(connection, scheduleUpdates, userHandler);
        if (!updateSchedulesResult.success) {
            throw new Error(updateSchedulesResult.error || 'Batch update failed');
        }

        const { updatedIds } = updateSchedulesResult.result;

        let updatedEventsWithStatus: EventStateResItem[] = [];
        if (updatedIds.length > 0) {
            const placeholders = updatedIds.map(() => '?').join(',');
            const [schedules] = await connection.execute(
                `SELECT active_event_id FROM schedules WHERE id IN (${placeholders})`,
                updatedIds
            );
            const eventIds = (schedules as any[])
                .map(s => s.active_event_id)
                .filter(id => id && id > 0);

            if (eventIds.length > 0) {
                const eventsProps = eventIds.map(id => ({ id, length: 0, event_type: 0 }));
                updatedEventsWithStatus = await buildTikEvents(connection, eventsProps);
            }
        }

        await connection.commit();
        
        ConfigManager.setConfigHash({ userHandler, hashType: 'events' });
        ConfigManager.setConfigHash({ userHandler, hashType: 'schedules' });
        const hashPayload = OuterSyncService.buildUpdateOuterHashPayload('upsert', { userHandler, hashType: 'events'});
        const schedulesHashPayload = OuterSyncService.buildUpdateOuterHashPayload('upsert', { userHandler, hashType: 'schedules'});
        // need to be refreshed cause event's state is part of event in web.
        const eventsPayload = OuterSyncService.addOuterActionInEvents(updatedEventsWithStatus, 'update');
        tikResponse = await OuterSyncService.updateOuterEntries(
            [...hashPayload, ...schedulesHashPayload, ...eventsPayload],
            reqHeaders
        );

        return {
            data: {
                success: true,
                totalUpdated: updateSchedulesResult.result?.totalUpdated || 0,
            },
            debug: {
                [thisProjectResProp()]: {
                    updateSchedulesResult,
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
                updatedSchedules: [],
            },
            debug: {
                [thisProjectResProp()]: {
                    updateSchedulesResult,
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
