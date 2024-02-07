import {Schedule} from "../../models/Schedule";


export async function saveDefaultSchedule () {
    return await Schedule.build({
        name: 'Таймер по умолчанию',
        scheduleType: 'default',
    }).save()
}
