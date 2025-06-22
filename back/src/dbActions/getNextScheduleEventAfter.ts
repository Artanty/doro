import {ScheduleEvent} from "../models/ScheduleEvent";
import {
    Op,
    Sequelize
} from "@sequelize/core";

export async function getNextScheduleEventAfter (currentEvent: ScheduleEvent) {
    return await ScheduleEvent.findOne({
        where: {
            timeFrom: {
                [Op.gt]: currentEvent?.timeFrom // Find events starting after the time of the current event
            }
        },
        order: [
            ['timeFrom', 'ASC'] // Order by timeFrom ascending to get the earliest event
        ]
    });
}
