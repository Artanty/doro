import express from 'express'
import { EventController } from '../controllers/eventController';
import { handleError } from '../utils/handleError'
import { getUserFromRequest } from '../utils/getUserFromRequest';

import { dd } from '../utils/dd';
import { AccessLevelController } from '../controllers/access-level.controller';

const router = express.Router();

router.post('/list', async (req, res) => {
  try {
    // const user = getUserFromRequest(req);
    const result = await AccessLevelController.getAccessLevels();
    res.json(result);
  } catch (error) {
    handleError(res as unknown as Response, error) 
  }
});

export default router;