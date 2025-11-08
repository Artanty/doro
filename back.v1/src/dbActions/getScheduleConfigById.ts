import { Transaction } from "@sequelize/core";
import {ScheduleConfig} from "../models/ScheduleConfig";
import { addToTransactionQueue } from "../utils/transactionQueue";
import { Database } from "../core/dbConnect";

export async function getScheduleConfigById (id: number): Promise<ScheduleConfig> {
    const scheduleConfig = await ScheduleConfig.findByPk(id);

    if (!scheduleConfig) {
        throw new Error(`ScheduleConfig with id ${id} not found`);
    }

    return scheduleConfig;
}
