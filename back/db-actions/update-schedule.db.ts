import { DbActionResult } from "../types/db-action.types";
import { getUTCDatetime } from "../utils/get-utc-datetime";

export async function updateScheduleDb(
    connection: any,
    scheduleId: number,
    params: {
        name?: string;
        active_event_id?: number;
        is_playing?: boolean;
        event_playhead?: number;
    }
): Promise<DbActionResult<any>> {
    const { name, active_event_id, is_playing, event_playhead } = params;
    
    const res: any = {
		success: false,
		result: null,
		error: null
	}

    try {
        const currentTime = getUTCDatetime();
    
        // Build dynamic SET clause
        const setClauses: string[] = [];
        const values: any[] = [];
        
        if (name !== undefined) {
            setClauses.push('name = ?');
            values.push(name);
        }
        
        if (active_event_id !== undefined) {
            setClauses.push('active_event_id = ?');
            values.push(active_event_id);
        }
        
        if (is_playing !== undefined) {
            setClauses.push('is_playing = ?');
            values.push(is_playing ? 1 : 0);
        }
        
        if (event_playhead !== undefined) {
            setClauses.push('event_playhead = ?');
            values.push(event_playhead);
        }
        
        // Always update updated_at
        setClauses.push('updated_at = ?');
        values.push(currentTime);
        
        // Add scheduleId for WHERE clause
        values.push(scheduleId);
        
        // Build query
        const query = `
            UPDATE schedules 
            SET ${setClauses.join(', ')}
            WHERE id = ?
        `;
        
        const [result] = await connection.execute(query, values);
        
        res.result = result;

        if (result.affectedRows > 0) {
            res.success = true;
        } else {
            res.error = 'No access or schedule not found'
        }

    } catch (error: any) {
        res.error = error.message;
    } finally {
        return res;
    }
}

export interface BatchUpdateScheduleItem {
    id: number;
    name?: string;
    active_event_id?: number;
    is_playing?: boolean;
    event_playhead?: number;
}

export interface BatchUpdateScheduleResult {
    totalRequested: number;
    totalUpdated: number;
    updatedIds: number[];
    notFoundIds: number[];
}

/**
 * Batch update schedules owned by userHandler — single statement.
 * Only updates rows WHERE id IN (...) AND created_by = ?.
 */
export async function batchUpdateScheduleDb(
    connection: any,
    updates: BatchUpdateScheduleItem[],
    userHandler: string
): Promise<DbActionResult<BatchUpdateScheduleResult>> {
    const res: any = {
        success: false,
        result: null,
        error: null
    };

    try {
        if (!updates || updates.length === 0) {
            throw new Error('No updates provided');
        }

        const currentTime = getUTCDatetime();
        const ids = updates.map(u => u.id);
        const placeholders = ids.map(() => '?').join(',');

        const setClauses: string[] = ['updated_at = ?'];
        const caseValues: any[] = [];

        const fields = ['name', 'active_event_id', 'is_playing', 'event_playhead'] as const;

        for (const field of fields) {
            const matching = updates.filter(u => u[field] !== undefined);
            if (matching.length === 0) continue;

            if (field === 'is_playing') {
                const cases = matching.map(u => `WHEN ? THEN ?`).join(' ');
                const vals = matching.flatMap(u => [u.id, u[field] ? 1 : 0]);
                setClauses.push(`${field} = CASE id ${cases} END`);
                caseValues.push(...vals);
            } else {
                const cases = matching.map(u => `WHEN ? THEN ?`).join(' ');
                const vals = matching.map(u => [u.id, u[field]]);
                setClauses.push(`${field} = CASE id ${cases} END`);
                caseValues.push(...vals.flat());
            }
        }

        const query = `
            UPDATE schedules
            SET ${setClauses.join(', ')}
            WHERE id IN (${placeholders})
              AND created_by = ?
        `;

        const [result] = await connection.execute(
            query,
            [...caseValues, currentTime, ...ids, userHandler]
        );

        const updatedCount = result.affectedRows;
        const notFoundIds = ids.length - updatedCount;

        res.success = true;
        res.result = {
            totalRequested: ids.length,
            totalUpdated: updatedCount,
            updatedIds: ids.slice(0, updatedCount),
            notFoundIds: ids.slice(updatedCount),
        };

    } catch (error: any) {
        res.error = error.message;
    } finally {
        return res;
    }
}