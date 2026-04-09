import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '@middlewares/auth';
import { AuthService, sanitizeUser } from '@services/authService';
import { successResponse } from '@utils/response';
import { AppError } from '@utils/errors';
import { env } from '@config/environment';
import {
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE_MAX_AGE,
  AUTH_MESSAGES,
} from '@constants/auth';
import { RegisterInput, LoginInput } from '@validators/auth';

//Cookie helpers
const cookieOptions = {
  httpOnly: true,
  secure: env.nodeEnv === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE,
};

const setRefreshCookie = (res: Response, token: string) =>
  res.cookie(REFRESH_TOKEN_COOKIE, token, cookieOptions);

const clearRefreshCookie = (res: Response) =>
  res.clearCookie(REFRESH_TOKEN_COOKIE, cookieOptions);

//Controllers

/** POST /auth/register */
const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { user, accessToken, refreshToken } = await AuthService.register(req.body as RegisterInput);
    setRefreshCookie(res, refreshToken);
    successResponse(res, { user, accessToken }, AUTH_MESSAGES.REGISTER_SUCCESS, 201);
  } catch (error) {
    next(error);
  }
};

/** POST /auth/login */
const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body as LoginInput;
    const { user, accessToken, refreshToken } = await AuthService.login(email, password);
    setRefreshCookie(res, refreshToken);
    successResponse(res, { user, accessToken }, AUTH_MESSAGES.LOGIN_SUCCESS);
  } catch (error) {
    next(error);
  }
};

/** POST /auth/logout */
const logout = (_req: Request, res: Response): void => {
  clearRefreshCookie(res);
  successResponse(res, null, AUTH_MESSAGES.LOGOUT_SUCCESS);
};

/** POST /auth/refresh-token */
const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = (req.cookies as Record<string, string | undefined>)[REFRESH_TOKEN_COOKIE];
    if (!token) {
      clearRefreshCookie(res);
      return next(AppError.unauthorized('Unauthorized'));
    }
    const tokens = await AuthService.refreshToken(token);
    setRefreshCookie(res, tokens.refreshToken);
    successResponse(res, { accessToken: tokens.accessToken }, AUTH_MESSAGES.TOKEN_REFRESHED);
  } catch (error) {
    clearRefreshCookie(res);
    next(error);
  }
};

/** GET /auth/me */
const me = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    successResponse(res, sanitizeUser(req.user!));
  } catch (error) {
    next(error);
  }
};

export const AuthController = { register, login, logout, refreshToken, me };
