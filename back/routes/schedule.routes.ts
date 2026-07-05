import express from 'express'
import { handleError } from '../utils/handleError'
import { getUserFromRequest } from '../utils/getUserFromRequest';
import { dd } from '../utils/dd';
import { ScheduleController } from '../controllers/schedule.controller';
import typia from 'typia';
import { CreateFullScheduleReq, DeleteScheduleReq } from '@contracts/schedule.contracts';



const router = express.Router();

router.post('/list', async (req, res) => {
  try {
    const user = getUserFromRequest(req);
    const result = await ScheduleController.getSchedules(user);
    res.json(result);
  } catch (error) {
    handleError(res as unknown as Response, error) 
  }
});

router.post('/create', async (req, res) => {
  try {
    const name = req.body.name;
    const active_event_id = 0;
    const is_playing = false;
    const user = getUserFromRequest(req);
    const result = await ScheduleController.createSchedule(user, name, active_event_id, is_playing);
    res.json(result);
  } catch (error) {
    handleError(res as unknown as Response, error) 
  }
});

router.post('/create-full', async (req, res) => {
  try {
    const assertCreateFullSchedule = typia.createAssert<CreateFullScheduleReq>();
    assertCreateFullSchedule(req.body)

    const user = getUserFromRequest(req);
    const result = await ScheduleController.createFullSchedule(user, req.body);
    res.json(result);
  } catch (error) {
    handleError(res as unknown as Response, error) 
  }
});

router.post('/suggest-rest', async (req, res) => {
  try {
    const scheduleId = req.body.scheduleId;
    // const user = getUserFromRequest(req);
    const result = await ScheduleController.suggestRest(scheduleId)
    res.json(result);
  } catch (error) {
    handleError(res as unknown as Response, error) 
  }
});

router.post('/delete', async (req, res) => {
  try {
    const assertDeleteSchedule = typia.createAssert<DeleteScheduleReq>();
    assertDeleteSchedule(req.body)
    
    const user = getUserFromRequest(req);
    const result = await ScheduleController.deleteSchedule(user, req.body.scheduleId)
    res.json(result);
  } catch (error) {
    handleError(res as unknown as Response, error) 
  }
});


export default router;