import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ success: false, message: 'Route not found' });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ success: false, message: err.message });
  }

  console.error(err);
  return res.status(500).json({ success: false, message: 'Internal server error' });
}
