import ScheduleConfigController from "../controllers/scheduleConfigController";
import express from "express";
const router = express.Router();

router.post('/scheduleConfig/:action',async (req, res) => {
  const action = req.params.action;
  let response = null

  if (action === 'activate') {
      response = await ScheduleConfigController.activateScheduleConfig(req.body.scheduleConfigId)
  }
  if (action === 'playEvent') {
      response = await ScheduleConfigController.playScheduleEvent(req.body.scheduleConfigId, req.body.scheduleEventId, req.body.scheduleId)
  }
  if (action === 'pauseEvent') {
      response = await ScheduleConfigController.pauseScheduleEvent(req.body.scheduleConfigId, req.body.scheduleEventId, req.body.scheduleId)
  }
  if (action === 'resumeEvent') {
      response = await ScheduleConfigController.resumeScheduleEvent(req.body.scheduleConfigId, req.body.scheduleEventId, req.body.scheduleId)
  }
  if (action === 'stopEvent') {
      response = await ScheduleConfigController.stopScheduleEvent(req.body.scheduleConfigId, req.body.scheduleEventId, req.body.scheduleId)
  }
  if (action === 'changePlayingEvent') {
      response = await ScheduleConfigController.changePlayingEvent(req.body.scheduleConfigId, req.body.scheduleEventId, req.body.scheduleId)
  }
  if (action === 'get') {
      response = await ScheduleConfigController.getScheduleConfig()
  }
  return res.send(response);
})

export default router;