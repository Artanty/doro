import express from 'express'
import { EventController } from '../controllers/eventController';
import { handleError } from '../utils/handleError'
import { getUserFromRequest } from '../utils/getUserFromRequest';

import { dd } from '../utils/dd';
import { EventStateController } from '../controllers/eventStateController';
const router = express.Router();

router.post('/set-event-state', async (req, res) => {
  try {
    const { eventId, state } = req.body;
    const user = getUserFromRequest(req);
    const itemId = await EventStateController.createOrUpdateEventState(
      eventId, state, user
    );
    res.status(201).json({ eventState: itemId });
  } catch (error: unknown) {
    res.status(500).json({ error: (error as any)?.message ? (error as any).message : error });
  }
});

router.post('/list-by-user', async (req, res) => {
  try {
    const user = getUserFromRequest(req);
    const data = await EventStateController.getUserEventStates(user);
    res.json(data);
  } catch (error) {
    handleError(res as unknown as Response, error) 
  }
});

router.post('/list-by-user-with-status', async (req, res) => {
  try {
    const user = getUserFromRequest(req);
    const data = await EventStateController.getEventsWithStatus(user);
    res.json(data);
  } catch (error) {
    handleError(res as unknown as Response, error) 
  }
});

router.post('/play', async (req, res) => {
  try {
    const user = getUserFromRequest(req);
    const { eventId } = req.body;
    const data = await EventStateController.playOrDuplicateEvent(user, eventId);
    res.json(data);
  } catch (error) {
    handleError(res as unknown as Response, error) 
  }
});

// router.post('/get-one', async (req, res) => {
//   try {
//     const { id } = req.body;
//     const user = getUserFromRequest(req);
//     const data = await EventController.getEventById(user, id);
//     res.json(data);
//   } catch (error) {
//     handleError(res as unknown as Response, error) 
//   }
// });
  
// router.post('/update', async (req, res) => {
//   try {
//     const { id, name, length, type } = req.body;
//     const user = getUserFromRequest(req);
//     const itemId = await EventController.updateEvent(
//       id, name, length, type, user
//     );

//     res.json({ success: true });
//   } catch (error) {
//     handleError(res as unknown as Response, error) 
//   }
// });

// router.post('/delete', async (req, res) => {
//   try {
//     const { id } = req.body;
//     const user = getUserFromRequest(req);
//     const success = await EventController.deleteEvent(
//       id, user
//     );
    
//     res.json({ success: true });
//   } catch (error) {
//     handleError(res as unknown as Response, error) 
//   }
// });

export default router;