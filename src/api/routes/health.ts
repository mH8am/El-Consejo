import { Router } from 'express';
import { client } from '../../bot/client';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    bot: client.isReady() ? 'online' : 'offline',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

export default router;
