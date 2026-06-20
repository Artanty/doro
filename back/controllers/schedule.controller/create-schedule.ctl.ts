import createPool from '../../core/db_connection';
import { createScheduleDb } from '../../db-actions/create-schedule.db';
import { upsertScheduleAccessDb } from '../../db-actions/upsert-schedule-access.db';
import { thisProjectResProp } from '../../utils/getResProp';

export const createScheduleCtl = async (
    userHandler: string,

    name: string,
    active_event_id: number,
	is_playing: boolean
): Promise<any> => {
    try {

        const pool = createPool();
        const connection = await pool.getConnection();

        let createSchduleResult,
            upsertScheduleAccessResult;

        createSchduleResult = await createScheduleDb(connection, userHandler, name,  active_event_id, is_playing)
        upsertScheduleAccessResult = await upsertScheduleAccessDb(connection, createSchduleResult.result, userHandler, 3);
        
        return {
            data: createSchduleResult.result,
            debug: {
                [thisProjectResProp()]: {
                    createSchduleResult,
                    upsertScheduleAccessResult
                }
            }
        };

    } catch (err) {
        return { status: 'err' }
    }
}