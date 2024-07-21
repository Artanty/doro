import { Transaction } from "@sequelize/core";
import { getBusy } from "..";
import { Database } from "../core/dbConnect";
import {ScheduleConfig} from "../models/ScheduleConfig";
import { dd } from "../utils";
import { addToTransactionQueue } from "../utils/transactionQueue";

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