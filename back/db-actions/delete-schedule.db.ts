import { dd } from "../utils/dd";
import { getUTCDatetime } from "../utils/get-utc-datetime";
import { Nullable } from "../utils/utility.types";
import { DbActionResult } from "./create-event.db";

// todo add permisions check
export const deleteScheduleDb = async (
    connection: any, 
    scheduleId: number,
): Promise<DbActionResult> => {

    const res = {
        success: false,
        result: null,
        error: null
    }
    
    try {
        const [result] = await connection.execute(
            'DELETE FROM schedules WHERE id = ?',
            [scheduleId]
        );
        
        if (!result.affectedRows) {
            throw new Error(`no schedules deleted by id ${scheduleId}`);
        }

        res.success = true;
        res.result = result.affectedRows
    } catch (error: any) {
        res.error = error.message
    } finally {
        return res;
    }
}

