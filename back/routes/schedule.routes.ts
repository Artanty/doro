import express from 'express'
import { handleError } from '../utils/handleError'
import { getUserFromRequest } from '../utils/getUserFromRequest';
import { dd } from '../utils/dd';
import { ScheduleController } from '../controllers/schedule.controller';

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
    const user = getUserFromRequest(req);
    const result = await ScheduleController.createSchedule(name, user);
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




export default router;