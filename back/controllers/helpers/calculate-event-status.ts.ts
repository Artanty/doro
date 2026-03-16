import { eventProgress } from "../../core/constants";
import { DbActionResult } from "../../db-actions/create-event";
import { GetEventStateResult, getEventState } from "../../db-actions/get-event-state";
import { getEventStateHistory } from "../../db-actions/get-event-state-history";
import { MinimalEventProps, EventStatus, ActionResult } from "../../types/event-state.types";

/**
* Calculate event status and current seconds based on state and history
*/
export const calculateEventStatus = async (
    connection, 
    event: MinimalEventProps
): Promise<ActionResult<EventStatus>> => {
    const debug = {};
    const eventId = event.id;
    const eventLengthSeconds = event.length;
    let currentStateResult: DbActionResult<GetEventStateResult>;
        
    currentStateResult = await getEventState(connection, event);

    if (!currentStateResult.success) {
        throw new Error(currentStateResult.error ?? 'undefined error, check wtf')
    }

    const currentStateObj = currentStateResult.result!;
    const currentState = currentStateObj.event_state_id;

    if (currentState === eventProgress.STOPPED) {
        return {
            success: true,
            result: {
                status: eventProgress.STOPPED,
                currentSeconds: 0,    
            },
            debug: {
                currentStateResult
            }  
        };
    } else if (currentState === eventProgress.COMPLETED) {
        return {
            success: true,
            result: {
                status: eventProgress.COMPLETED,
                currentSeconds: 0,
            }, 
            debug
        };
    }
         
    const historyResult = await getEventStateHistory(connection, eventId);
        
    if (!historyResult.success) {
        throw new Error(historyResult.error ?? 'history undefined error, check wtf')
    }

    const history = historyResult.result!.length 
        ? historyResult.result!
        : [currentStateObj];
    // если не STOPPED и не COMPLETED, значит точно было запущено
    let totalActiveSeconds = 0;
    let activeStartTime: Date | null = null;
        
    // Calculate total active time from history
    for (const record of history) {
        if (record.event_state_id === eventProgress.PLAYING && activeStartTime === null) {
            // Start of active period - create UTC date
            activeStartTime = new Date(record.created_at + 'Z');
        } else if (
            (record.event_state_id === eventProgress.STOPPED || 
                record.event_state_id === eventProgress.PAUSED) && 
            activeStartTime !== null
        ) {
            // End of active period - calculate duration with UTC date
            const activeEndTime = new Date(record.created_at + 'Z');
            const diff = activeEndTime.getTime() - activeStartTime.getTime();
            const durationSeconds = Math.floor(diff / 1000);
            totalActiveSeconds += durationSeconds;
            activeStartTime = null;
        }
    }
        
    // If currently active and we have an open active period
    if (currentState === eventProgress.PLAYING && activeStartTime !== null) {
        const currentTime = new Date();
        // Get current time in UTC
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
    }

    // Cap at event length
    const currentSeconds = Math.min(totalActiveSeconds, eventLengthSeconds);

    if (currentState === eventProgress.PLAYING) {
        return {
            success: true,
            result: {
                status: currentSeconds >= eventLengthSeconds ? eventProgress.COMPLETED : eventProgress.PLAYING,
                currentSeconds: currentSeconds,
            }, debug
        };
    } else if (currentState === eventProgress.PAUSED) {
        return {
            success: true,
            result: {
                status: eventProgress.PAUSED,
                currentSeconds: currentSeconds,
            }, debug
        };
    }

    return {
        success: true,
        result: {
            status: eventProgress.STOPPED,
            currentSeconds: 0,
        }, debug
    };
}