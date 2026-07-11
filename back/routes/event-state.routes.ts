import express from 'express'
import { EventController } from '../controllers/event.controller';
import { handleError } from '../utils/handleError'
import { getUserFromRequest } from '../utils/getUserFromRequest';
import { dd } from '../utils/dd';
import { EventStateController } from '../controllers/event-state.controller';
import { BatchUpdateScheduleItem } from '../db-actions/update-schedule.db';
import typia from 'typia';
import { PauseEventReq, PlayEventReq } from '@contracts/event-state.contract';

const assertPlayEvent = typia.createAssert<PlayEventReq>();
const assertPauseEvent = typia.createAssert<PauseEventReq>();


const router = express.Router();

router.post('/play', async (req, res) => {
  try {
    assertPlayEvent(req.body);
    const user = getUserFromRequest(req);
    
    const result = await EventStateController.playEvent(
      user, 
      req.body, 
      req.headers
    );
    res.json(result);
  } catch (error) {
    handleError(res as unknown as Response, error) 
  }
});

/// DANGER! ReQUIRED SCHDEULE IDS!
router.post('/set-event-state', async (req, res) => {
  try {
    const scheduleUpdates: BatchUpdateScheduleItem[] = req.body.scheduleUpdates;
    const user = getUserFromRequest(req);
    const result = await EventStateController.updateEventState(
      user, 
      scheduleUpdates,
      req.headers
    );
    res.status(201).json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: (error as any)?.message ? (error as any).message : error });
  }
});

router.post('/stop', async (req, res,) => {
  try {
    const user = getUserFromRequest(req);
    const { eventId, state } = req.body;
    const result = await EventStateController.stopEventRunHooks(
      user, eventId, state,
      req.headers
    );
    res.json(result);
  } catch (error) {
    handleError(res as unknown as Response, error) 
  }
});

router.post('/pause', async (req, res,) => {
  try {
    const props = assertPauseEvent(req.body);
    
    const user = getUserFromRequest(req);
    const { eventId, scheduleId } = props;
    const result = await EventStateController.pauseEvent(
      user, 
      eventId, 
      scheduleId,
      req.headers
    );
    res.json(result);
  } catch (error) {
    handleError(res as unknown as Response, error) 
  }
});

router.post('/delete-finished-transitions', async (req, res) => {
  try {
    const { eventType, eventStateId } = req.body;
    const result = await EventStateController.deleteFinishedEvents(
      eventType, eventStateId);
    res.json(result);
  } catch (error) {
    handleError(res as unknown as Response, error) 
  }
});

export default router;