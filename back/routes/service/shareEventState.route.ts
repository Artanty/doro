import express from 'express'
import { EventStateController } from "../../controllers/eventStateController";
import { dd } from "../../utils/dd";
import { getUserFromRequest } from "../../utils/getUserFromRequest";
import { handleError } from "../../utils/handleError";

const router = express.Router();
// [validateApiKey, validateUserAccessToken]
router.post('/share-event-state', async (req, res) => {
  try {
    dd('/share-event-state')
    const user = getUserFromRequest(req);
    const data = await EventStateController.getEventsWithStatus(user);
    dd(data)
    res.json(data);   
  } catch (error) {
    handleError(res as unknown as Response, error) 
  }
});

export default router;
