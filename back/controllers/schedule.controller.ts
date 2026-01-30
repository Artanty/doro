import { getSchedules } from "../db-actions/get-schedules";
import { thisProjectResProp } from "../utils/getResProp";
import createPool from '../core/db_connection';
import { createSchedule } from "../db-actions/create-schedule";
import { getScheduleWithEvents } from "../db-actions/get-schedules-with-events";

export default class ScheduleController {

    public static async getSchedules(
        userHandler: string
    ): Promise<any> {
        try {

            const pool = createPool();
            const connection = await pool.getConnection();

            let getSchdulesResult;

            getSchdulesResult = await getSchedules(connection, userHandler)

            return {
                data: getSchdulesResult.result,
                debug: {
                    [thisProjectResProp()]: {
                        getSchdulesResult
                    }
                }
            };

        } catch (err) {
            return { status: 'err' }
        }
    }

    public static async createSchedule(
        name: string,
        userHandler: string
    ): Promise<any> {
        try {

            const pool = createPool();
            const connection = await pool.getConnection();

            let createSchduleResult;

            createSchduleResult = await createSchedule(connection, name, userHandler)

            return {
                data: createSchduleResult.result,
                debug: {
                    [thisProjectResProp()]: {
                        createSchduleResult
                    }
                }
            };

        } catch (err) {
            return { status: 'err' }
        }
    }

    public static async getScheduleWithEvents(
        userHandler: string,
        scheduleId: number,
    ): Promise<any> {
        try {

            const pool = createPool();
            const connection = await pool.getConnection();

            let getSchduleWithEventsResult;

            getSchduleWithEventsResult = await getScheduleWithEvents(connection, userHandler, scheduleId)

            return {
                data: getSchduleWithEventsResult.result,
                debug: {
                    [thisProjectResProp()]: {
                        getSchduleWithEventsResult
                    }
                }
            };

        } catch (err) {
            return { status: 'err' }
        }
    }
} 