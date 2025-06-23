import express, { Router } from "express";
import PingController from "../controllers/ping";
import EventsController from "../controllers/events";
import StatusController from "../controllers/status";
import scheduleEvent from "./scheduleEvent";
import scheduleConfig from './scheduleConfig';
import ScheduleController from "../controllers/schedule";
import ScheduleConfigController from "../controllers/scheduleConfigController";
import ScheduleEventController from "../controllers/scheduleEvent";
import saveTempRoutes from "./saveTempRoutes";

const router = express.Router();

router.get("/events", async (_req, res) => {
    const controller = new EventsController(_req, res);
    const response = await controller.handleEvents();
});

router.get("/ping", async (_req, res) => {
    const controller = new PingController();
    const response = await controller.getMessage();
    return res.send(response);
});

router.get("/status", async (_req, res) => {
    const controller = new StatusController();
    const response = await controller.getMessage();
    return res.send(response);
});

router.post("/getScheduleConfig", async (_req: any, res) => {

    const response = await ScheduleConfigController.getScheduleConfig()//ById(_req.scheduleConfigId);
    return res.send(response);
});

router.post("/getSchedule", async (_req, res) => {
    const controller = new ScheduleController()
    const response = await controller.getSchedule(_req.body.id);
    return res.send(response);
});
router.post("/getScheduleEvents", async (_req, res) => {
    const response = await ScheduleEventController.getScheduleEventsByScheduleId(_req.body.id);
    return res.send(response);
});

router.get("/ping", async (_req, res) => {
    res.send({
        message: "hello",
    });
});
router.get("/", async (_req, res) => {
    res.send({
        message: "hello",
    });
});

const routes = [scheduleEvent, scheduleConfig]
export function collectRoutes(app: express.Application): void {
    routes.forEach((route: Router) => {
        app.use(route);
    })
}

router.use('/save-temp', saveTempRoutes);


export default router;