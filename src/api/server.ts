import express from 'express';
import healthRouter from './routes/health';
import playersRouter from './routes/players';
import statsRouter from './routes/stats';
import { errorHandler } from './middleware/errorHandler';
import { log } from '../utils/logger';

const app = express();
app.use(express.json());

// Routes
app.use('/health', healthRouter);
app.use('/api/players', playersRouter);
app.use('/api/stats', statsRouter);

// Global error handler — always last
app.use(errorHandler);

export function startApi(): void {
  // fly.io sets PORT=8080; fall back to API_PORT for local dev
  const port = parseInt(process.env.PORT ?? process.env.API_PORT ?? '4000', 10);
  app.listen(port, () => log('info', `🌐 API running on :${port}`));
}
