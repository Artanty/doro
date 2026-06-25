import createPool from '../../core/db_connection';
import { thisProjectResProp } from '../../utils/getResProp';
import { getEventDb } from '../../db-actions/get-event.db';
import { GetRunningEventsResItem } from '../../db-actions/get-running-events.db';
import { calculatePlayhead } from '../event-state.controller/get-running-events.helper';

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
        const rows: GetRunningEventsResItem[] = getEventDbResult.result

         const eventsWithPlayhead: GetRunningEventsResItem[] = rows
            .map(el => {
                if (el.schedule_is_playing && el.is_active_event) {
                    /**
                     * На фронте по этому условию статус ивента будем ждать от @tik:
                     * if (eventProps.schedule_is_playing && eventProps.is_active_event)
                     * Поэтому расписание нужно остановить, если реально кончился ивент.
                     */
                    const correctPlayhead = calculatePlayhead(el);
                    return {
                        ...el,
                        playhead: correctPlayhead,
                        schedule_is_playing: Number(el.length !== correctPlayhead), // todo что-от с этим сделать   
                    }
                }
                return el;
            })

        await connection.commit();

        return {
            data: eventsWithPlayhead,
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
