import express from 'express'
import { EventController } from '../controllers/event.controller';
import { handleError } from '../utils/handleError'
import { getUserFromRequest } from '../utils/getUserFromRequest';
import { dd } from '../utils/dd';
import { UpsertEventStateItem } from '../db-actions/upsert-event-state';
import { EventStateController } from '../controllers/event-state.controller';
const router = express.Router();

router.post('/set-event-state', async (req, res) => {
  try {
    const eventStates: UpsertEventStateItem[] = req.body.eventStates;
    const user = getUserFromRequest(req);
    const result = await EventStateController.updateEventState(
      user, 
      eventStates,
    );
    res.status(201).json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: (error as any)?.message ? (error as any).message : error });
  }
});

router.post('/play', async (req, res) => {
  try {
    const user = getUserFromRequest(req);
    const { eventId } = req.body;
    const result = await EventStateController.playOrDuplicateEvent(user, eventId);
    res.json(result);
  } catch (error) {
    handleError(res as unknown as Response, error) 
  }
});

router.post('/stop', async (req, res,) => {
  try {
    const user = getUserFromRequest(req);
    const { eventId, state } = req.body;
    const result = await EventStateController.stopEventRunHooks(user, eventId, state);
    res.json(result);
  } catch (error) {
    handleError(res as unknown as Response, error) 
  }
});

router.post('/pause', async (req, res,) => {
  try {
    const user = getUserFromRequest(req);
    const { eventId, state } = req.body;
    const result = await EventStateController.pauseEvent(user, +eventId, +state);
    res.json(result);
  } catch (error) {
    handleError(res as unknown as Response, error) 
  }
});

router.post('/delete-finished-transitions', async (req, res) => {
  try {
    const { eventType, eventStateId } = req.body;
    const result = await EventStateController.deleteFinishedEvents(eventType, eventStateId);
    res.json(result);
  } catch (error) {
    handleError(res as unknown as Response, error) 
  }
});

export default router;