import { DEFAULT_DURATIONS, SESSIONS_BEFORE_LONG_BREAK } from "../core/constants";
import { dd } from "../utils/dd";
import { DbActionResult } from "./create-event";


// Event type constants
const EVENT_TYPES = {
    WORK: 1,
    REST: 2
};

interface RestSuggestion {
    shouldTakeLongBreak: boolean;
    restType: 'short' | 'long';
    restDuration: number; // in seconds
    sessionsSinceLastLongBreak: number;
    lastEvents: Array<{
        type: number;
        length: number;
        schedule_position: number;
    }>;
}

export const suggestRestBreak = async (
    connection: any,
    scheduleId: number
): Promise<DbActionResult> => {
    const res = {
        success: false,
        result: null as RestSuggestion | null,
        error: null as string | null
    };

    try {
        // Get last 20 events for this schedule, ordered by position
        const [events] = await connection.execute(
            `SELECT 
                e.type,
                e.length,
                e.schedule_position,
                e.event_state_id as state
             FROM events e
             WHERE e.schedule_id = ?
             ORDER BY e.schedule_position DESC
             LIMIT 20`,
            [scheduleId]
        );

        if (!events || events.length === 0) {
            // No events yet, suggest short break after first work session
            res.success = true;
            res.result = {
                shouldTakeLongBreak: false,
                restType: 'short',
                restDuration: DEFAULT_DURATIONS.SHORT_REST,
                sessionsSinceLastLongBreak: 0,
                lastEvents: []
            };
            return res;
        }

        // Count work sessions and track when last long break occurred
        let workSessionCount = 0;
        let sessionsSinceLastLongBreak = 0;
        let foundLongBreak = false;

        // Process events in chronological order (oldest to newest)
        const chronologicalEvents = [...events].reverse();

        for (const event of chronologicalEvents) {
            if (event.type === EVENT_TYPES.WORK) {
                workSessionCount++;
                if (!foundLongBreak) {
                    sessionsSinceLastLongBreak++;
                }
            } else if (event.type === EVENT_TYPES.REST) {
                // Check if this is a long break (you might want to add a field to distinguish)
                // For now, we'll consider rests longer than 10 minutes as long breaks
                if (event.length > 10 * 60) { // More than 10 minutes
                    foundLongBreak = true;
                    sessionsSinceLastLongBreak = 0;
                }
            }
        }

        // Determine if we need a long break
        const shouldTakeLongBreak = sessionsSinceLastLongBreak >= SESSIONS_BEFORE_LONG_BREAK;
        
        // Get the most recent rest duration to suggest similar
        const lastRestEvent = events.find(e => e.type === EVENT_TYPES.REST);
        const suggestedRestDuration = shouldTakeLongBreak 
            ? DEFAULT_DURATIONS.LONG_REST
            : (lastRestEvent?.length || DEFAULT_DURATIONS.SHORT_REST);

        res.success = true;
        res.result = {
            shouldTakeLongBreak,
            restType: shouldTakeLongBreak ? 'long' : 'short',
            restDuration: suggestedRestDuration,
            sessionsSinceLastLongBreak,
            lastEvents: events.slice(0, 10) // Return last 10 for debugging
        };

        return res;
    } catch (error: any) {
        dd(error.message);
        res.error = error.message;
        return res;
    }
};

// More detailed version with schedule-specific settings
export const suggestRestBreakWithSettings = async (
    connection: any,
    scheduleId: number,
    scheduleSettings?: {
        workDuration?: number;
        shortRestDuration?: number;
        longRestDuration?: number;
        sessionsBeforeLongBreak?: number;
    }
): Promise<DbActionResult> => {
    const res = {
        success: false,
        result: null as RestSuggestion | null,
        error: null as string | null
    };

    try {
        // Merge with defaults
        const settings = {
            workDuration: scheduleSettings?.workDuration || DEFAULT_DURATIONS.WORK,
            shortRestDuration: scheduleSettings?.shortRestDuration || DEFAULT_DURATIONS.SHORT_REST,
            longRestDuration: scheduleSettings?.longRestDuration || DEFAULT_DURATIONS.LONG_REST,
            sessionsBeforeLongBreak: scheduleSettings?.sessionsBeforeLongBreak || SESSIONS_BEFORE_LONG_BREAK
        };

        // Get last 20 events
        const [events] = await connection.execute(
            `SELECT 
                e.type,
                e.length,
                e.schedule_position,
                e.event_state_id as state
             FROM events e
             WHERE e.schedule_id = ?
             ORDER BY e.schedule_position DESC
             LIMIT 20`,
            [scheduleId]
        );

        // Count work sessions in reverse (most recent first)
        let workSessionCount = 0;
        let sessionsSinceLastLongBreak = 0;
        
        // Look at last N events to count work sessions
        for (const event of events) {
            if (event.type === EVENT_TYPES.WORK) {
                workSessionCount++;
                sessionsSinceLastLongBreak++;
            } else if (event.type === EVENT_TYPES.REST) {
                // Check if this was a long break (duration matches long rest setting)
                if (Math.abs(event.length - settings.longRestDuration) < 60) { // Within 1 minute
                    sessionsSinceLastLongBreak = 0;
                    break;
                }
            }
        }

        const shouldTakeLongBreak = sessionsSinceLastLongBreak >= settings.sessionsBeforeLongBreak;

        res.success = true;
        res.result = {
            shouldTakeLongBreak,
            restType: shouldTakeLongBreak ? 'long' : 'short',
            restDuration: shouldTakeLongBreak ? settings.longRestDuration : settings.shortRestDuration,
            sessionsSinceLastLongBreak,
            lastEvents: events.slice(0, 10)
        };

        return res;
    } catch (error: any) {
        dd(error.message);
        res.error = error.message;
        return res;
    }
};