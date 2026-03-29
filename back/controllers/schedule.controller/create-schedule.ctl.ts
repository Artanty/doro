import createPool from '../../core/db_connection';
import { createSchedule } from '../../db-actions/create-schedule';
import { thisProjectResProp } from '../../utils/getResProp';

export const createScheduleCtl = async (
    name: string,
    userHandler: string
): Promise<any> => {
    try {

        const pool = createPool();
        const connection = await pool.getConnection();

        let createSchduleResult;

        createSchduleResult = await createSchedule(connection, name, userHandler)

        return {
            data: createSchduleResult.result,
            debug: {
                [thisProjectResProp()]: {
                    createSchduleResult
                }
            }
        };

    } catch (err) {
        return { status: 'err' }
    }
}