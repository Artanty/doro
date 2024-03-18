import {ScheduleEvent} from "../models/ScheduleEvent";

export async function createScheduleEvents (scheduleId: number, data: any[]) {
    const dataToCreate = data.map((el: any) => {
      el.schedule_id = scheduleId
      return el
    }) 
   
    return await ScheduleEvent.bulkCreate(dataToCreate);
  }