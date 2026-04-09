// Time windows (in milliseconds)
export const RATE_LIMIT_WINDOWS = {
  FIFTEEN_MINUTES: 15 * 60 * 1000,
  ONE_HOUR:        60 * 60 * 1000,
} as const;

// Maximum requests per window
export const RATE_LIMIT_MAX_REQUESTS = {
  GLOBAL:   300,  // Feed browsing + post interactions: 300 req / 15 min per IP
  STRICT:   5,    // Login: 5 req / 15 min — brute-force protection
  REGISTER: 5,    // Registration: 5 req / hour per IP
  TOKEN:    10,   // Token refresh: 10 req / hour
} as const;

// User-facing error messages
export const RATE_LIMIT_MESSAGES = {
  GENERIC:  'Too many requests. Please try again later.',
  STRICT:   'Too many attempts. Please try again in 15 minutes.',
  REGISTER: 'Too many account creation attempts. Please try again in an hour.',
  TOKEN:    'Too many token refresh requests. Please try again later.',
} as const;

// HTTP 429 error code
export const RATE_LIMIT_ERROR_CODE = 'TOO_MANY_REQUESTS' as const;
