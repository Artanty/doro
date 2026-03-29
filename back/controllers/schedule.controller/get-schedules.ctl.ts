import createPool from '../../core/db_connection';
import axios from 'axios';
import { getSchedules } from '../../db-actions/get-schedules';
import { thisProjectResProp } from '../../utils/getResProp';

export const getSchedulesCtl = async (
    userHandler: string
): Promise<any> => {
    try {

        const pool = createPool();
        const connection = await pool.getConnection();

        let getSchdulesResult;

        getSchdulesResult = await getSchedules(connection, userHandler)

        return {
            data: getSchdulesResult.result,
            debug: {
                [thisProjectResProp()]: {
                    getSchdulesResult
                }
            }
        };

    } catch (err) {
        return { status: 'err' }
    }
}