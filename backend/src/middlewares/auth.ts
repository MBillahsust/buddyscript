import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Document } from 'mongoose';
import { env } from '@config/environment';
import { AppError } from '@utils/errors';
import { User } from '@models/User';

export interface AuthUser extends Document {
  email: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
  avatarUrl: string | null;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

const extractBearerToken = (authHeader: string | undefined): string | null => {
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.split(' ')[1] ?? null;
};

/**
 * Protect a route — verifies the Bearer JWT and attaches `req.user`.
 *
 * @example
 * router.get('/me', protect(), meController);
 */
export function protect() {
  return async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = extractBearerToken(req.headers.authorization);
      if (!token) return next(AppError.unauthorized('Unauthorized'));

      const decoded = jwt.verify(token, env.jwtSecret) as { userId: string };
      const user = await User.findById(decoded.userId);
      if (!user) return next(AppError.unauthorized('Unauthorized'));

      req.user = user as unknown as AuthUser;
      next();
    } catch (error) {
      if (
        error instanceof jwt.TokenExpiredError ||
        error instanceof jwt.JsonWebTokenError
      ) {
        return next(AppError.unauthorized('Unauthorized'));
      }
      next(AppError.unauthorized('Unauthorized'));
    }
  };
}

