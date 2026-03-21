import express from 'express'
import { OuterSyncService } from '../controllers/outer-sync.service';
import { validateUserAccessToken } from '../middlewares/validateUserAccessToken';
import { dd } from '../utils/dd';
import { getUserFromRequest } from '../utils/getUserFromRequest';
import { handleError } from '../utils/handleError';
import { EventStateController } from '../controllers/event-state.controller';

const router = express.Router();

router.post('/get-event-state', [validateUserAccessToken], async (req, res) => {
  try {
    const user = getUserFromRequest(req);
    const data = await EventStateController.getEventsWithStatus(user);
    dd(data)
    res.json(data);   
  } catch (error) {
    handleError(res as unknown as Response, error) 
  }
});

router.post('/set-event-state', async (req, res) => {
  try {
    const { eventId: stringEventId, state } = req.body;
    const eventId = Number(stringEventId);
    const data = await OuterSyncService.updateEventStateByOuterApp(eventId, state);
    res.json(data);
  } catch (error) {
    handleError(res as unknown as Response, error) 
  }
});

export default router;
