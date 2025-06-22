import ScheduleEventController from "../controllers/scheduleEvent";
import express from "express";
const router = express.Router();

router.post('/scheduleEvent/:action', async (req, res) => {
  try {
      const action = req.params.action;
      let response = null

      if (action === 'create') {
          response = await ScheduleEventController.createScheduleEvent(req.body)
      }
      if (action === 'delete') {
          response = await ScheduleEventController.deleteScheduleEvent(req.body)
      }
      if (action === 'createAndPlay') {
          response = await ScheduleEventController.createDefaultEventsAndPlay(req.body)
      }
      /**
       * + save as current shcedule
       */
      if (action === 'batchCreate') {
          response = await ScheduleEventController.createScheduleWithEvents(req.body)
      }

      return res.send(response);   
  } catch (err) {
      return res.status(400).send(handleError(err));
  }
})

function handleError(error: unknown): { error: string } {
  let errorText = ''
  if (error instanceof Error) {
      errorText = error.message
  }
  errorText = String(error)
  
  const result = {
      error: errorText.replace(/\n/g, ' ')
  }
  return result
}

export default router;