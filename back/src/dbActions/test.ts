import {ScheduleConfig} from "../models/ScheduleConfig";
import {Database} from "../core/dbConnect";

export async function test (testCase: string) {
    switch (testCase) {
        case '1':
            return await ScheduleConfig.findOne({
                order: [
                    ['createdAt', 'DESC'],
                    ['updatedAt', 'DESC'],
                ]
            })
            break;
        case '2':
            try {
                // Find the last record
                const lastRecord = await ScheduleConfig.findOne({
                    order: [['createdAt', 'DESC']] // Assuming there's a createdAt column, change this according to your setup
                });

                if (!lastRecord) {
                    return;
                }
                return await lastRecord.destroy();
            } catch (error) {
                console.error('Error deleting last record:', error);
            }
            break;
        case '3':
            try {
                await Database.getInstance().destroyAll();
                return { res: 'destroyAll'}
            } catch (error) {
                console.error('Error destroyAll:', error);
            }
            break;
        default:
            return 0;
            break;

    }

}