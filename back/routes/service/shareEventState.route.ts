import express from 'express'
import { EventController } from '../../controllers/eventController';
import { handleError } from '../../utils/handleError'
import { getUserFromRequest } from '../../utils/getUserFromRequest';

import { dd } from '../../utils/dd';
import { EventStateController } from '../../controllers/eventStateController';
const router = express.Router();

router.post('/share-event-state', async (req, res) => {
  try {
    const user = getUserFromRequest(req);
    const data = await EventStateController.getEventsWithStatus(user);
    res.json(data);
  } catch (error) {
    handleError(res as unknown as Response, error) 
  }
});

export default router;