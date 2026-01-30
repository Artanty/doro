import express from 'express'
import dotenv from 'dotenv'
import eventTypeRoutes from './routes/eventTypeRoutes'
import eventRoutes from './routes/eventRoutes'
import saveTempRoutes from './routes/saveTempRoutes'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import checkDBConnection from './core/db_check_connection'
import { validateUserAccessToken } from './middlewares/validateUserAccessToken'
import eventStateRoutes from './routes/eventStateRoutes'
import shareEventStateRoute from './routes/service/shareEventState.route'
import { validateApiKey } from './middlewares/validateApiKey'
import { dd } from './utils/dd'
import { ConfigManager } from './controllers/config-manager'
import { injectConfigHashMiddleware } from './middlewares/inject-config-hash.middleware'
import { OuterSyncService } from './controllers/outer-sync.service'
import accessLevelRoutes from './routes/access-level.routes'
import scheduleRoutes from './routes/schedule.routes'

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Global Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(cors()) // todo dev only

app.use('/access-level', accessLevelRoutes);
app.use('/eventType', eventTypeRoutes);
app.use('/event', validateUserAccessToken, injectConfigHashMiddleware, eventRoutes);
app.use('/event-state', validateUserAccessToken, injectConfigHashMiddleware, eventStateRoutes);
app.use('/schedule', validateUserAccessToken, injectConfigHashMiddleware, scheduleRoutes);
app.use('/save-temp', saveTempRoutes);
app.use('/service', [validateApiKey, validateUserAccessToken], shareEventStateRoute);

app.get('/get-updates', async (req, res) => {
  res.json({
    trigger: 'clientIP',
    PORT: process.env.PORT,
    isSendToStat: 'sendToStatResult',
  });    
});

// Start the server
app.listen(PORT, () => {
  dd(`Server is running on port ${PORT}`);
  checkDBConnection()
  ConfigManager.setConfigHash(); // принудительно сеттим, потому что чтение не меняет хэш.
  OuterSyncService.updateOuterConfigHash(); // todo дождаться, пока tik@ сам сюда стукнется?
});