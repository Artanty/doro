import express from 'express'
import { EventTypeController } from '../controllers/eventTypeController';
import { handleError } from '../utils/handleError'
import { getUserFromRequest } from '../utils/getUserFromRequest';

import { dd } from '../utils/dd';
const router = express.Router();

router.post('/create', async (req, res) => {
  try {
    const { name } = req.body;
    const itemId = await EventTypeController.createEventType(
      name
    );
    res.status(201).json({ id: itemId });
  } catch (error: unknown) {
    res.status(500).json({ error: (error as any)?.message ? (error as any).message : error });
  }
});

router.post('/list', async (req, res) => {
  try {
    const data = await EventTypeController.getEventTypes();
    res.json(data);
  } catch (error) {
    handleError(res as unknown as Response, error) 
  }
});
  
router.post('/update', async (req, res) => {
  const { id, name } = req.body;
  try {
    const success = await EventTypeController.updateEventType(
      id,
      name
    );

    res.json({ success: true });
  } catch (error) {
    handleError(res as unknown as Response, error) 
  }
  // res.status(503).json({ error: 'not implemented' });
});


router.post('/delete', async (req, res) => {
  try {
    const { id } = req.body;
    const success = await EventTypeController.deleteEventType(
      id,
    );
    
    res.json({ success: true });
  } catch (error) {
    handleError(res as unknown as Response, error) 
  }
});

export default router;