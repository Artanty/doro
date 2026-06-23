import { DbActionResult } from "../types/db-action.types";
import { getUTCDatetime } from "../utils/get-utc-datetime";

export async function updateScheduleDb(
    connection: any,
    scheduleId: number,
    params: {
        name?: string;
        active_event_id?: number;
        is_playing?: boolean;
    }
): Promise<DbActionResult<any>> {
    const { name, active_event_id, is_playing } = params;
    
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

        return res;
        
    } catch (error: any) {
        res.error = error.message

        return res;
    }
    
}