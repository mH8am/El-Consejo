import { Request, Response, NextFunction } from 'express';

export function apiKeyAuth(req: Request, res: Response, next: NextFunction): void {
  if (!process.env.API_SECRET_KEY) {
    res.status(401).json({ error: 'API authentication is not configured on this server.' });
    return;
  }
  const key = req.headers['x-api-key'];
  if (key !== process.env.API_SECRET_KEY) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}
