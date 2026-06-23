import createPool from '../../core/db_connection';

import { thisProjectResProp } from '../../utils/getResProp';
import { getEventDb, GetEventResItem } from '../../db-actions/get-event.db';




export const getEventCtl = async (userHandler: string, filters: any) => {
    const pool = createPool();
    const connection = await pool.getConnection();


    let getEventDbResult,
        calculateBulkEventProgressResult,
        bulkUpsertEventStateResult;
    try {
        await connection.beginTransaction();

        getEventDbResult = await getEventDb(connection, userHandler, filters);
        if (!getEventDbResult.success) {
            throw new Error(getEventDbResult.error)
        }
        const rows: GetEventResItem[] = getEventDbResult.result

        await connection.commit();

        return {
            data: rows,
            debug: {
                [thisProjectResProp()]: {
                    getEventDbResult,
                    calculateBulkEventProgressResult,
                    bulkUpsertEventStateResult,
                },
            }
        };
    } catch (error: any) { 
        // return {
        //     success: false,
        //     result: [],
        //     error: error.message,
        //     debug: {
        //         getEventDbResult
        //     }
        // };
        console.log(error);
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}
