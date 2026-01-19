import express from 'express'
import { EventController } from '../controllers/eventController';
import { handleError } from '../utils/handleError'
import { getUserFromRequest } from '../utils/getUserFromRequest';

import { dd } from '../utils/dd';
const router = express.Router();

router.post('/create', async (req, res) => {
  try {
    const { name, length, type, base_access, state } = req.body;
    const user = getUserFromRequest(req);
    const result = await EventController.createEvent(
      name, length, type, user, base_access, state,
    );
    res.status(201).json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: (error as any)?.message ? (error as any).message : error });
  }
});

router.post('/list', async (req, res) => {
  try {
    const user = getUserFromRequest(req);
    const result = await EventController.getUserEvents(user);
    res.json(result);
  } catch (error) {
    handleError(res as unknown as Response, error) 
  }
});

router.post('/get-one', async (req, res) => {
  try {
    const { id } = req.body;
    const user = getUserFromRequest(req);
    const data = await EventController.getEventById(user, id);
    res.json(data);
  } catch (error) {
    handleError(res as unknown as Response, error) 
  }
});
  
router.post('/update', async (req, res) => {
  try {
    const { id, name, length, type } = req.body;
    const user = getUserFromRequest(req);
    const itemId = await EventController.updateEvent(
      id, name, length, type, user
    );

    res.json({ success: true });
  } catch (error) {
    handleError(res as unknown as Response, error) 
  }
});

router.post('/delete', async (req, res) => {
  try {
    const { id } = req.body;
    const user = getUserFromRequest(req);
    const result = await EventController.deleteEvent(
      id, user
    );

    res.json(result);
  } catch (error) {
    handleError(res as unknown as Response, error) 
  }
});

export default router;