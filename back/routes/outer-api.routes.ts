import express from 'express'
import { EventStateController } from '../controllers/eventStateController';
import { OuterSyncService } from '../controllers/outer-sync.service';
import { validateUserAccessToken } from '../middlewares/validateUserAccessToken';
import { dd } from '../utils/dd';
import { getUserFromRequest } from '../utils/getUserFromRequest';
import { handleError } from '../utils/handleError';

const router = express.Router();

router.post('/share-event-state', [validateUserAccessToken], async (req, res) => {
  try {
    const user = getUserFromRequest(req);
    const data = await EventStateController.getEventsWithStatus(user);
    dd(data)
    res.json(data);   
  } catch (error) {
    handleError(res as unknown as Response, error) 
  }
});

router.post('/receive-event-state', async (req, res) => {
  try {
    const { eventId, state } = req.body;
    const data = await OuterSyncService.updateEventStateByOuterApp(eventId, state);
    res.json(data);
  } catch (error) {
    handleError(res as unknown as Response, error) 
  }
});

export default router;
