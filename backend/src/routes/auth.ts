/**
 * Authentication Routes
 *
 * POST /auth/register       — create account (registerLimiter + Zod validation)
 * POST /auth/login          — authenticate (strictLimiter + Zod validation)
 * POST /auth/logout         — clear refresh token cookie
 * POST /auth/refresh-token  — rotate refresh token (tokenLimiter)
 * GET  /auth/me             — get current user (requires Bearer token)
 */
import { Router } from 'express';
import { AuthController } from '@controllers/authController';
import { validate } from '@middlewares/validate';
import { strictLimiter, registerLimiter, tokenLimiter } from '@middlewares/rateLimiter';
import { protect } from '@middlewares/auth';
import { registerSchema, loginSchema } from '@validators/auth';

export const authRouter = Router();

authRouter.post('/register', registerLimiter, validate(registerSchema), AuthController.register);
authRouter.post('/login', strictLimiter, validate(loginSchema), AuthController.login);
authRouter.post('/logout', AuthController.logout);
authRouter.post('/refresh-token', tokenLimiter, AuthController.refreshToken);
authRouter.get('/me', protect(), AuthController.me);
