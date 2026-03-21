import createPool from '../../core/db_connection';
import axios from 'axios';
import dotenv from 'dotenv';
import { dd } from '../../utils/dd';
import { thisProjectResProp } from '../../utils/getResProp';
import { getEventDb, GetEventResItem } from '../../db-actions/get-event.db';
import { eventProgress } from '../../core/constants';
import { BulkEventProgressResponse, EventProgressResult, EventStateRecord } from '../../types/event-state.types';
import { bulkUpsertEventState } from '../../db-actions/upsert-event-state';

dotenv.config();

/**
 * Если ивент закончен по времени, но еще не знает об этом - он будет закончен перед отправкой.
 * */
export const getEventCtl = async (userHandler: string, filters: any) => {
    const pool = createPool();
    const connection = await pool.getConnection();
    let getEventDbResult,
        calculateBulkEventProgressResult,
        bulkUpsertEventStateResult;
    try {
        getEventDbResult = await getEventDb(connection, userHandler, filters);
        if (!getEventDbResult.success) {
            throw new Error(getEventDbResult.error)
        }
        const rows: GetEventResItem[] = getEventDbResult.result
        const doubleCheckArr = rows.filter(el => el.event_state_id === 1);
        const readyArr = rows.filter(el => el.event_state_id !== 1);

        const eventsToDoubleCheck = doubleCheckArr.map(el => {
            return {
                eventId: el.id,
                eventLengthSeconds: el.length,
                currentState: el.event_state_id
            }
        })

        const raw = await calculateBulkEventProgress(connection, eventsToDoubleCheck)
        if (raw.results.size > 0) {
            const eventsToComplete: number[] = [];
            doubleCheckArr.forEach(el => {
                const checked = raw.results.get(el.id);
                if (checked?.status === 3) {
                    eventsToComplete.push(el.id);
                }
            })
            if (eventsToComplete.length > 0) {
                const payload = eventsToComplete.map(evId => {
                    return {
                        eventId: evId, 
                        state: 3
                    }
                })
                bulkUpsertEventStateResult = await bulkUpsertEventState(connection, payload);
                // todo: mb add history add?
            }
        }
        calculateBulkEventProgressResult = Object.fromEntries(raw.results);

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


/**
 * Calculate progress for multiple events from their state history
 */
export const calculateBulkEventProgress = async (
    connection: any,
    events: Array<{
        eventId: number;
        eventLengthSeconds: number;
        currentState: number;
    }>
): Promise<BulkEventProgressResponse> => {
    const results = new Map<number, EventProgressResult>();
    const errors = new Map<number, string>();
    const debug: any = {
        totalEvents: events.length,
        processedEvents: 0,
        failedEvents: 0
    };

    if (!events || events.length === 0) {
        return {
            success: true,
            results,
            errors,
            debug
        };
    }

    try {
        // Get all histories in one query
        const eventIds = events.map(e => e.eventId);
        const placeholders = eventIds.map(() => '?').join(',');
        
        const [allHistories] = await connection.execute(
            `SELECT eventId as event_id, event_state_id, created_at 
             FROM eventStateHistory 
             WHERE eventId IN (${placeholders})
             ORDER BY eventId, created_at ASC`,
            eventIds
        );

        // Group histories by event_id
        const historiesByEvent = new Map<number, EventStateRecord[]>();
        allHistories.forEach((record: any) => {
            if (!historiesByEvent.has(record.event_id)) {
                historiesByEvent.set(record.event_id, []);
            }
            historiesByEvent.get(record.event_id)!.push({
                event_state_id: record.event_state_id,
                created_at: record.created_at
            });
        });

        // Calculate progress for each event
        for (const event of events) {
            const history = historiesByEvent.get(event.eventId) || [];
            
            let totalActiveSeconds = 0;
            let activeStartTime: Date | null = null;
            const eventDebug: any = {
                historyLength: history.length
            };
            
            // Calculate from history
            for (const record of history) {
                if (record.event_state_id === eventProgress.PLAYING && activeStartTime === null) {
                    activeStartTime = new Date(record.created_at + 'Z');
                    eventDebug.activeStart = activeStartTime;
                } else if (
                    (record.event_state_id === eventProgress.STOPPED || 
                        record.event_state_id === eventProgress.PAUSED) && 
                    activeStartTime !== null
                ) {
                    const activeEndTime = new Date(record.created_at + 'Z');
                    const diff = activeEndTime.getTime() - activeStartTime.getTime();
                    const durationSeconds = Math.floor(diff / 1000);
                    totalActiveSeconds += durationSeconds;
                    eventDebug.addedDuration = { start: activeStartTime, end: activeEndTime, seconds: durationSeconds };
                    activeStartTime = null;
                }
            }
            
            // Handle current active period
            if (event.currentState === eventProgress.PLAYING && activeStartTime !== null) {
                const currentTime = new Date();
                const currentUTC = Date.UTC(
                    currentTime.getUTCFullYear(),
                    currentTime.getUTCMonth(),
                    currentTime.getUTCDate(),
                    currentTime.getUTCHours(),
                    currentTime.getUTCMinutes(),
                    currentTime.getUTCSeconds(),
                    currentTime.getUTCMilliseconds()
                );
                const diff = currentUTC - activeStartTime.getTime();
                const currentActiveSeconds = Math.floor(diff / 1000);
                totalActiveSeconds += currentActiveSeconds;
                eventDebug.currentActiveSeconds = currentActiveSeconds;
            }

            // Cap at event length
            const currentSeconds = Math.min(totalActiveSeconds, event.eventLengthSeconds);
            eventDebug.totalActiveSeconds = totalActiveSeconds;
            eventDebug.currentSeconds = currentSeconds;
            
            // Check if ended
            const isEnded = currentSeconds >= event.eventLengthSeconds;
            eventDebug.isEnded = isEnded;
            
            // Determine final status
            let finalStatus: number;
            
            if (isEnded) {
                finalStatus = eventProgress.COMPLETED;
                eventDebug.reason = 'Event duration completed';
            } else if (event.currentState === eventProgress.PLAYING) {
                finalStatus = eventProgress.PLAYING;
                eventDebug.reason = 'Still playing';
            } else if (event.currentState === eventProgress.PAUSED) {
                finalStatus = eventProgress.PAUSED;
                eventDebug.reason = 'Paused';
            } else {
                finalStatus = eventProgress.STOPPED;
                eventDebug.reason = 'Stopped';
            }
            
            results.set(event.eventId, {
                status: finalStatus,
                currentSeconds: currentSeconds,
                debug: eventDebug
            });
            
            debug.processedEvents++;
        }
        
        debug.failedEvents = errors.size;
        
        return {
            success: errors.size === 0,
            results,
            errors,
            debug
        };
        
    } catch (error: any) {
        return {
            success: false,
            results,
            errors: new Map(events.map(e => [e.eventId, error.message])),
            debug: {
                error: error.message,
                stack: error.stack
            }
        };
    }
};