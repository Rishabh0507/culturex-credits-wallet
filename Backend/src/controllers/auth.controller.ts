import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import { validateCredentials } from '../validators/authValidator';

export async function signup(req: Request, res: Response, next: NextFunction) {
  try {
    const credentials = validateCredentials(req.body);
    const result = await authService.signup(credentials);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const credentials = validateCredentials(req.body);
    const result = await authService.login(credentials);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
