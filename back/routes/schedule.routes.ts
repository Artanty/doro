import express from 'express'
import { EventController } from '../controllers/eventController';
import { handleError } from '../utils/handleError'
import { getUserFromRequest } from '../utils/getUserFromRequest';

import { dd } from '../utils/dd';
import { AccessLevelController } from '../controllers/access-level.controller';
import ScheduleController from '../controllers/schedule.controller';

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

router.post('/get-by-id-with-events', async (req, res) => {
  try {
    dd(req.body)
    const { scheduleId } = req.body;
    dd(scheduleId)
    const user = getUserFromRequest(req);
    const result = await ScheduleController.getScheduleWithEvents(user, scheduleId);
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

export default router;