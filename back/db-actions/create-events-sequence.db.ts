import { CreateFullScheduleReq } from "@contracts/schedule.contracts";
import { DbActionResult } from "../types/db-action.types";
import { getUTCDatetime } from "../utils/get-utc-datetime";

export const createEventsSequenceDb = async (
    connection: any, 
    
    scheduleId: number,
    config: CreateFullScheduleReq,
): Promise<DbActionResult> => {

    const res: any = {
        success: false,
        result: null,
        error: null
    }
    
    try {
        const {
            work,
            rest,
            bigRest,
            bigRestStep,
            cycles
        } = config;

        const currentDatetime = getUTCDatetime();
        const events: any[] = [];
        let position = 0;
        
        const workSeconds = work * 60;
        const restSeconds = rest * 60;
        const bigRestSeconds = bigRest * 60;

        for (let cycle = 1; cycle <= cycles; cycle++) {
            // Work event
            events.push([
                `Work ${cycle}`,
                workSeconds,
                0,
                false,
                scheduleId,
                position++,
                currentDatetime
            ]);

            // Rest event (if not the last cycle)
            if (cycle < cycles) {
                events.push([
                    `Rest ${cycle}`,
                    restSeconds,
                    0,
                    true,
                    scheduleId,
                    position++,
                    currentDatetime
                ]);
            }

            // Big rest after every bigRestStep cycles
            if (cycle < cycles && cycle % bigRestStep === 0) {
                events.push([
                    `Big Rest ${cycle}`,
                    bigRestSeconds,
                    0,
                    true,
                    scheduleId,
                    position++,
                    currentDatetime
                ]);
            }
        }

        // Batch insert
        if (events.length > 0) {
            const placeholders = events.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(', ');
            const flatValues = events.flat();
            
            const query = `
                INSERT INTO events 
                (name, length, playhead, is_rest, schedule_id, schedule_position, updated_at) 
                VALUES ${placeholders}
            `;
        
            const [createResult] = await connection.execute(query, flatValues);

            res.success = true;
            res.result = createResult;
        } else {
            throw new Error('no events to create');
        }
    } catch (error: any) {
        res.error = error.message
    } finally {
		return res;
	}
}