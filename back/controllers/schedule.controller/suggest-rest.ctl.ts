import createPool from '../../core/db_connection';
import axios from 'axios';
import dotenv from 'dotenv';
import { dd } from '../../utils/dd';
import { thisProjectResProp, tikResProp } from '../../utils/getResProp';
import { updateEvent } from '../../db-actions/update-event';
import { getAccessibleEvent, ACCESS_CASE } from '../../db-actions/get-accessible-event';
import { ConfigManager } from '../config-manager';
import { OuterSyncService } from '../outer-sync.service';
import { deleteFinishedEvents } from '../../db-actions/delete-finished-events';
import { suggestRestBreak } from '../../db-actions/suggest-rest';

export const suggestRestCtl = async (
    scheduleId,
) => {
    const pool = createPool();
    const connection = await pool.getConnection();
    let suggestRestResult;
        
    try {
        await connection.beginTransaction();

        suggestRestResult = await suggestRestBreak(connection, scheduleId);
        if (!suggestRestResult.success) {
            throw new Error(suggestRestResult.error!);
        }
        
        await connection.commit();

        return {
            data: suggestRestResult.result,
            debug: {
                [thisProjectResProp()]: {
                    suggestRestResult
                },
            }
        }
        
    } catch (error) {
        console.log(error);
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

// // Basic usage
// const suggestion = await suggestRestBreak(connection, 123);

// if (suggestion.success && suggestion.result) {
//     if (suggestion.result.shouldTakeLongBreak) {
//         console.log(`Take a long break: ${suggestion.result.restDuration / 60} minutes`);
//     } else {
//         console.log(`Take a short break: ${suggestion.result.restDuration / 60} minutes`);
//     }
//     console.log(`Sessions since last long break: ${suggestion.result.sessionsSinceLastLongBreak}`);
// }

// // With custom settings
// const customSuggestion = await suggestRestBreakWithSettings(
//     connection, 
//     123,
//     {
//         workDuration: 30 * 60,      // 30 min work
//         shortRestDuration: 7 * 60,   // 7 min short break
//         longRestDuration: 25 * 60,   // 25 min long break
//         sessionsBeforeLongBreak: 3    // Long break after 3 sessions
//     }
// );