import { Transaction } from "@sequelize/core";
import {ScheduleConfig} from "../models/ScheduleConfig";
import { addToTransactionQueue } from "../utils/transactionQueue";
import { Database } from "../core/dbConnect";


// export async function getScheduleConfigById(id: number): Promise<ScheduleConfig>  {
//     return addToTransactionQueue(async (id: number) => {
//       return Database.getInstance().transaction(async (transaction: Transaction) => {
//         try {
//           // Perform operations within the transaction
//                 const scheduleConfig = await ScheduleConfig.findByPk(id);
//                 // Commit the transaction
//                 console.log('Transaction committed successfully');
//                 await transaction.commit();
//                 if (!scheduleConfig) {
//                     throw new Error(`ScheduleConfig with id ${id} not found`);
//                 }
//                 return scheduleConfig;
          
//         } catch (error) {
//             // Rollback the transaction if an error occurs
//             console.error('Error performing database operations within transaction:', error);
//             await transaction.rollback(); // Rollback the transaction
//             throw error; // Rethrow the error to ensure the transaction is rolled back
//         }
//       });
//     });
//   }

export async function getScheduleConfigById (id: number): Promise<ScheduleConfig> {
    const scheduleConfig = await ScheduleConfig.findByPk(id);

    if (!scheduleConfig) {
        throw new Error(`ScheduleConfig with id ${id} not found`);
    }

    return scheduleConfig;
}
