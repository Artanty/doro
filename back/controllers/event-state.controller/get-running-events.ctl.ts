import { EVENT_TIK_ACTION_PROP } from "../../core/constants";
import createPool from "../../core/db_connection"
import { getRunningEventsDb } from "../../db-actions/get-running-events.db";
import { buildOuterEntityId } from "../../utils/buildOuterEntityId";
import { dd } from "../../utils/dd";
import { thisProjectResProp } from "../../utils/getResProp";
import { ConfigManager } from "../config-manager";
import { buildTikPlayingEvents } from "../helpers/build-tik-events";
import { OuterSyncService } from "../outer-sync.service";

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

        eventsWithTikStatus = await buildTikPlayingEvents(getRunningEventsResult.result);
        
        
        eventsWithTikAction = OuterSyncService.addOuterActionInEvents(eventsWithTikStatus, 'upsert');

        const configHashEntry = { 
            id: buildOuterEntityId('configHash', 1), // 1 - id
            cur: ConfigManager.configHash,
            [EVENT_TIK_ACTION_PROP]: 'upsert',
        };

        const productEntriesForTik: any[] = [...eventsWithTikAction, configHashEntry];
        
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