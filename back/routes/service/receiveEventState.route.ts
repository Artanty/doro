import express from 'express'
import { EventController } from '../../controllers/eventController';
import { handleError } from '../../utils/handleError'
import { getUserFromRequest } from '../../utils/getUserFromRequest';

import { dd } from '../../utils/dd';
import { EventStateController } from '../../controllers/eventStateController';
import { OuterSyncService } from '../../controllers/outer-sync.service';
const router = express.Router();

router.post('/receive-event-state', async (req, res) => {
    try {
      
        const { eventId, state } = OuterSyncService.entryAdapter(req.body);
        const data = await OuterSyncService.updateEventStateByOuterApp(eventId, state);
        res.json(data);
    } catch (error) {
        handleError(res as unknown as Response, error) 
    }
});

export default router;

