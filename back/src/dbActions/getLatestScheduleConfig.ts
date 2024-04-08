import { Transaction } from "@sequelize/core";
import { getBusy } from "..";
import { Database } from "../core/dbConnect";
import {ScheduleConfig} from "../models/ScheduleConfig";
import { dd } from "../utils";
import { addToTransactionQueue } from "../utils/transactionQueue";

// export async function getLatestScheduleConfig(): Promise<any> {
//     return await addToTransactionQueue(async () => {
//       return await Database.getInstance().transaction(async (transaction: Transaction) => {
//         try {
//           // Perform operations within the transaction
//           const scheduleConfig = await ScheduleConfig.findOne({
//               order: [
//                   ['createdAt', 'DESC'],
//                   ['updatedAt', 'DESC'],
//               ]
//           });

//           // Commit the transaction
//           await transaction.commit();
//           console.log('Transaction committed successfully');
          
//           return scheduleConfig;
          
//         } catch (error) {
//             // Rollback the transaction if an error occurs
//             console.error('Error performing database operations within transaction:', error);
//             await transaction.rollback(); // Rollback the transaction
//             throw error; // Rethrow the error to ensure the transaction is rolled back
//         }
//       });
//     });
// }

export async function getLatestScheduleConfig () {

    const scheduleConfig = await ScheduleConfig.findOne({
        order: [
            ['createdAt', 'DESC'],
            ['updatedAt', 'DESC'],
        ]
    })

    if (!scheduleConfig) {
        throw new Error(`ScheduleConfig not found`);
    }

    return scheduleConfig;
}