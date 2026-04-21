import { Request, Response, NextFunction } from 'express';
import { log } from '../../utils/logger';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  log('error', `[API Error] ${err.message}`);
  res.status(500).json({ error: 'Internal server error' });
}
