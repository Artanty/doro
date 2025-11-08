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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Global Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(cors()) // todo dev only

app.use('/eventType', eventTypeRoutes);
app.use('/event', validateUserAccessToken, eventRoutes);
app.use('/event-state', validateUserAccessToken, eventStateRoutes);
app.use('/save-temp', saveTempRoutes);

app.get('/get-updates', async (req, res) => {
  res.json({
    trigger: 'clientIP',
    PORT: process.env.PORT,
    isSendToStat: 'sendToStatResult',
  });    
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  checkDBConnection()
});