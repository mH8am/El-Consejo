import { Router } from 'express';
import { client } from '../../bot/client';
import { apiKeyAuth } from '../middleware/apiKeyAuth';

const router = Router();

router.get('/', apiKeyAuth, (_req, res) => {
  const guild = client.guilds.cache.first();
  res.json({
    guildName: guild?.name ?? 'Unknown',
    memberCount: guild?.memberCount ?? 0,
    botUptime: process.uptime(),
  });
});

export default router;
