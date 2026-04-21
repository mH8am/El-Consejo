import { Router } from 'express';
import { getTrackedPlayers } from '../../services/lpTracker';
import { apiKeyAuth } from '../middleware/apiKeyAuth';

const router = Router();

router.get('/', apiKeyAuth, (_req, res) => {
  res.json(getTrackedPlayers());
});

export default router;
