import { EVENT_TIK_ACTION_PROP } from "../../core/constants";
import createPool from "../../core/db_connection"
import { getRunningEventsDb, GetRunningEventsResItem } from "../../db-actions/get-running-events.db";
import { buildOuterEntityId } from "../../utils/buildOuterEntityId";
import { dd } from "../../utils/dd";
import { thisProjectResProp } from "../../utils/getResProp";
import { ConfigManager } from "../config-manager";
import { buildTikPlayingEvents } from "../helpers/build-tik-events";
import { OuterSyncService } from "../outer-sync.service";
import { calculatePlayhead } from "./get-running-events.helper";

export const getRunningEventsCtl = async (userHandler: any) => {
    const pool = createPool();
    const connection = await pool.getConnection();

    let 
        getRunningEventsResult,
        eventsWithTikStatus,
        eventsWithTikAction;

    try {
        await connection.beginTransaction();

        getRunningEventsResult = await getRunningEventsDb(
            connection,
            userHandler
        );
        
        if (!getRunningEventsResult.success) {
            throw new Error('getRunningEventsResult crashed')
        }

        /**
         * Рассчитываем текущий плейхэд каждого запущенного ивента,
         * удаляем из данных для @tik зкончившиеся ивенты.
         */
        const filteredEvents: GetRunningEventsResItem[] = getRunningEventsResult.result
            .map(el => ({ ...el, schedule_event_playhead: calculatePlayhead(el) }))
            .filter(el => el.length !== el.schedule_event_playhead);        

        eventsWithTikStatus = await buildTikPlayingEvents(filteredEvents);
                
        eventsWithTikAction = OuterSyncService.addOuterActionInEvents(eventsWithTikStatus, 'upsert');

        const outerHash1 = {
			id: buildOuterEntityId('configHash', 1),
			cur: ConfigManager.getConfigHash({ userHandler, hashType: 'events' }),
		};
		const outerHash2 = {
			id: buildOuterEntityId('configHash', 2),
			cur: ConfigManager.getConfigHash({ userHandler, hashType: 'schedules' }),
		};

		const hashsPayload = OuterSyncService.addOuterActionInEvents([outerHash1, outerHash2], 'upsert');

        const productEntriesForTik: any[] = [...eventsWithTikAction, ...hashsPayload];
        
        return {
            data: productEntriesForTik,
            debug: {
                [thisProjectResProp()]: {
                    getRunningEventsResult,
                    eventsWithTikStatus,
                    eventsWithTikAction,
                }
                
            }
        }

    } catch(error) {
        console.log(error);
		await connection.rollback();
		// throw error;
        return {
            success: false,
            error: true,
            data: null,
            debug: {
                [thisProjectResProp()]: {
                    getRunningEventsResult,
                    eventsWithTikStatus,
                    eventsWithTikAction,
                }
                
            }
        }
	} finally {
		connection.release();
	}
}

// data: null,
// debug: {
//     [thisProjectResProp()]: {
//         createEventResult,
//         createEventStateHookResult,
//         upsertScheduleAccessResult,
//         addHistoryResult
//     },
// }