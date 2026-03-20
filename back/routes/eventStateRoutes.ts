import express from 'express'
import { EventController } from '../controllers/event.controller';
import { handleError } from '../utils/handleError'
import { getUserFromRequest } from '../utils/getUserFromRequest';

import { dd } from '../utils/dd';
import { EventStateController } from '../controllers/eventStateController';
import { UpsertEventStateItem } from '../db-actions/upsert-event-state';

import { EventStateController2 } from '../controllers/event-state.controller';
const router = express.Router();

router.post('/set-event-state', async (req, res) => {
  try {
    const eventStates: UpsertEventStateItem[] = req.body.eventStates;
    const user = getUserFromRequest(req);
    const result = await EventStateController.createOrUpdateEventState(
      user, 
      eventStates,
      // eventId, state
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

router.post('/delete-finished-transitions', async (req, res) => {
  try {
    const { eventType, eventStateId } = req.body;
    const result = await EventStateController2.deleteFinishedEvents(eventType, eventStateId);
    res.json(result);
  } catch (error) {
    handleError(res as unknown as Response, error) 
  }
});

export default router;