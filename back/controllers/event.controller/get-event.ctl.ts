import createPool from '../../core/db_connection';
import { thisProjectResProp } from '../../utils/getResProp';
import { getEventDb } from '../../db-actions/get-event.db';
import { GetRunningEventsResItem } from '../../db-actions/get-running-events.db';
import { calculatePlayhead } from '../event-state.controller/get-running-events.helper';
import { batchUpdateScheduleDb } from '../../db-actions/update-schedule.db';
import { dd } from '../../utils/dd';

export const getEventCtl = async (userHandler: string, filters: any) => {
    dd('getEventCtl')
    debugger;
    const pool = createPool();
    const connection = await pool.getConnection();


    let getEventDbResult,
        calculateBulkEventProgressResult,
        // bulkUpsertEventStateResult
        batchUpdateScheduleResult
        ;
    try {
        await connection.beginTransaction();

        getEventDbResult = await getEventDb(connection, userHandler, filters);
        if (!getEventDbResult.success) {
            throw new Error(getEventDbResult.error)
        }
        const rows: GetRunningEventsResItem[] = getEventDbResult.result

        const schedulesToStop: number[] = [];
        const eventsWithPlayhead: GetRunningEventsResItem[] = rows
            .map(el => {
                if (el.schedule_is_playing && el.is_active_event) {
                    /**
                     * На фронте по этому условию статус ивента будем ждать от @tik:
                     * if (eventProps.schedule_is_playing && eventProps.is_active_event)
                     * Поэтому расписание нужно остановить, если реально кончился ивент.
                     */
                    const correctPlayhead = calculatePlayhead(el);
                    dd('el')
                    dd(el)
                    dd('correct playhead')
                    dd(correctPlayhead)
                    // обновляем скедьюлы, которые по факту стоп
                    if (
                        el.schedule_event_playhead !== correctPlayhead &&
                        el.schedule_event_playhead === el.length &&
                        el.is_active_event
                    ) {
                        schedulesToStop.push(el.schedule_id);
                    }
                    
                    return {
                        ...el,
                        schedule_event_playhead: correctPlayhead,
                        schedule_is_playing: Number(el.length !== correctPlayhead),
                    }
                }
                return el;
            })
        
        if(schedulesToStop.length) {
            batchUpdateScheduleResult = await batchUpdateScheduleDb(
                connection,
                schedulesToStop.map(sId => ({ id: sId, is_playing: false }))
            )
        }
        

        await connection.commit();

        return {
            data: eventsWithPlayhead,
            debug: {
                [thisProjectResProp()]: {
                    getEventDbResult,
                    calculateBulkEventProgressResult,
                    // bulkUpsertEventStateResult,
                    batchUpdateScheduleResult,
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
