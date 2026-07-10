import express from 'express'
import { EventController } from '../controllers/event.controller';
import { handleError } from '../utils/handleError'
import { getUserFromRequest } from '../utils/getUserFromRequest';
import { CreateEventReq } from '@contracts/event.contract';
import typia from 'typia';
const assertCreateEvent = typia.createAssert<CreateEventReq>();

const router = express.Router();

router.post('/create', async (req, res) => {
  try {
    assertCreateEvent(req.body);

    const user = getUserFromRequest(req);
    const result = await EventController.createEvent(
      user, 
      req.body, 
      req.headers
    );
    res.status(201).json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: (error as any)?.message ? (error as any).message : error });
  }
});

router.post('/get', async (req, res) => {
  try {
    const { filters } = req.body;
    const user = getUserFromRequest(req);
    const result = await EventController.getEvents(user, filters);
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
      id, rest, user,
      req.headers
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
      id, user,
      req.headers
    );

    res.json(result);
  } catch (error) {
    handleError(res as unknown as Response, error) 
  }
});

export default router;