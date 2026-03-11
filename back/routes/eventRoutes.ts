import express from 'express'
import { EventController } from '../controllers/event.controller';
import { handleError } from '../utils/handleError'
import { getUserFromRequest } from '../utils/getUserFromRequest';
const router = express.Router();

router.post('/create', async (req, res) => {
  try {
    const { name, length, type, base_access, state, hooks } = req.body;
    const user = getUserFromRequest(req);
    const result = await EventController.createEvent(
      name, length, type, user, base_access, state, hooks
    );
    res.status(201).json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: (error as any)?.message ? (error as any).message : error });
  }
});

router.post('/get', async (req, res) => {
  try {
    const user = getUserFromRequest(req);
    const result = await EventController.getEvents(user);
    res.json(result);
  } catch (error) {
    handleError(res as unknown as Response, error) 
  }
});
  
router.post('/update', async (req, res) => {
  try {
    const { id, ...rest } = req.body;
    const user = getUserFromRequest(req);
    const result = await EventController.updateEvent(
      id, rest, user
    );

    res.json(result);
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