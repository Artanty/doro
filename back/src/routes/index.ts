import express from "express";
import PingController from "../controllers/ping";
import SetTimersConfigController from "../controllers/timersConfig";
import EventsController from "../controllers/events";
import StatusController from "../controllers/status";
import CounterActionController from "../controllers/counterAction";
import { dd } from "../utils";

const router = express.Router();

router.get("/events", async (_req, res) => {
    dd('sse connection....')
    const controller = new EventsController(_req, res);
    const response = await controller.handleEvents();
    // return res.send(response);
});

router.get("/ping", async (_req, res) => {
    const controller = new PingController();
    const response = await controller.getMessage();
    return res.send(response);
});

router.post("/setTimersConfig2", async (_req, res) => {
    const controller = new SetTimersConfigController();
    const response = await controller.setTimersConfig(_req.body);
    return res.send(response);
});

router.get("/status", async (_req, res) => {
    const controller = new StatusController();
    const response = await controller.getMessage();
    return res.send(response);
});



export default router;