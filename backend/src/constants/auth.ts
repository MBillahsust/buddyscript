/** Name of the httpOnly cookie that carries the refresh token. */
export const REFRESH_TOKEN_COOKIE = 'refreshToken' as const;

/**
 * Max-age for the refresh token cookie in milliseconds.
 * Must match REFRESH_TOKEN_EXPIRES_IN in .env (default: 7d).
 */
export const REFRESH_TOKEN_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

/** Standardised auth response messages. */
export const AUTH_MESSAGES = {
  REGISTER_SUCCESS: 'Account created successfully',
  LOGIN_SUCCESS:    'Logged in successfully',
  LOGOUT_SUCCESS:   'Logged out successfully',
  TOKEN_REFRESHED:  'Token refreshed successfully',
} as const;
