import { AppError } from '../utils/appError';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface Credentials {
  email: string;
  password: string;
}

export function validateCredentials(body: any): Credentials {
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!EMAIL_REGEX.test(email)) {
    throw new AppError(400, 'A valid email is required');
  }
  if (password.length < 8) {
    throw new AppError(400, 'Password must be at least 8 characters long');
  }

  return { email, password };
}
