import { dd } from "../utils/dd";
import { getUTCDatetime } from "../utils/get-utc-datetime";
import { Nullable } from "../utils/utility.types";
import { DbActionResult } from "./create-event.db";

// todo add permisions check ?
export const deleteScheduleDb = async (
    connection: any, 
    scheduleId: number,
    userHandler?: string,
): Promise<DbActionResult> => {
    const res: any = {
        success: false,
        result: null,
        error: null
    }
    let 
        permissionResult,
        deleteResult
        ;
    try {
        if (userHandler) {
            [permissionResult] = await connection.execute(
                `SELECT 
                    CASE 
                        WHEN s.created_by = ? THEN 'owner'
                        WHEN stu.access_level_id = 3 THEN 'deleter'
                        ELSE NULL
                    END AS permission_type
                FROM schedules s
                LEFT JOIN scheduleToUser stu ON stu.schedule_id = s.id AND stu.user_handler = ?
                WHERE s.id = ?`,
                [userHandler, userHandler, scheduleId]
            );
            
            if (permissionResult.length === 0) {
                throw new Error(`Schedule ${scheduleId} not found`);
            }
            
            if (!permissionResult[0].permission_type) {
                throw new Error(`User ${userHandler} does not have delete permission for schedule ${scheduleId}`);
            }
        } 
        
        
        // Delete the schedule (ON DELETE CASCADE handles events and scheduleToUser)
        [deleteResult] = await connection.execute(
            'DELETE FROM schedules WHERE id = ?',
            [scheduleId]
        );
        
        if (!deleteResult.affectedRows) {
            throw new Error(`No schedule found with id ${scheduleId}`);
        }

        res.success = true;
        res.result = {
            affectedRows: deleteResult.affectedRows,
            permissionType: permissionResult?.[0]?.permission_type,
        };
    } catch (error: any) {
        res.error = error.message;
        res.result = {
            affectedRows: deleteResult.affectedRows,
            permissionType: permissionResult?.[0]?.permission_type,
        };
    } finally {
        return res;
    }
}

