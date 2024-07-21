import express from "express";
import TestController from "../controllers/test";
const app = express.Router();

app.get("/test", async (_req, res) => {
  const testCase = _req.query.case ?? '1'
  const controller = new TestController(testCase);
  const response = await controller.handle();
  return res.send(response);
});