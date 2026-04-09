import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '@models/User';
import { env } from '@config/environment';
import { AppError } from '@utils/errors';

const BCRYPT_ROUNDS = 12;

// Lazily-computed dummy hash used in login to prevent user-enumeration via timing.
// Comparing against this takes the same time as a real bcrypt.compare.
let _dummyHash: string | null = null;
const getDummyHash = () => {
  if (!_dummyHash) _dummyHash = bcrypt.hashSync('__dummy__', BCRYPT_ROUNDS);
  return _dummyHash;
};

const generateTokens = (userId: string) => {
  const payload = { userId };
  const accessToken = jwt.sign(
    payload,
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn } as jwt.SignOptions,
  );
  const refreshToken = jwt.sign(
    payload,
    env.refreshTokenSecret,
    { expiresIn: env.refreshTokenExpiresIn } as jwt.SignOptions,
  );
  return { accessToken, refreshToken };
};

export const sanitizeUser = (user: { _id: unknown; email: string; firstName: string; lastName: string; avatarUrl?: string | null }) => ({
  id: String(user._id),
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  avatarUrl: user.avatarUrl ?? null,
});

/** Register a new user and return tokens. */
const register = async (data: {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}) => {
  const existing = await User.findOne({ email: data.email });
  if (existing) throw AppError.conflict('Registration failed. Please check your details and try again.');

  const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
  const user = await User.create({
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    passwordHash,
  });

  const tokens = generateTokens(String(user._id));
  return { user: sanitizeUser(user), ...tokens };
};

/** Authenticate a user and return tokens. */
const login = async (email: string, password: string) => {
  const user = await User.findOne({ email });

  // SECURITY: always run bcrypt even when user not found to prevent timing attacks
  if (!user) {
    await bcrypt.compare(password, getDummyHash());
    throw AppError.unauthorized('Invalid email or password');
  }

  const isValid = await bcrypt.compare(password, user.passwordHash as string);
  if (!isValid) throw AppError.unauthorized('Invalid email or password');

  const tokens = generateTokens(String(user._id));
  return { user: sanitizeUser(user), ...tokens };
};

/** Issue new tokens from a valid refresh token (rotates the refresh token). */
const refreshToken = async (token: string) => {
  try {
    const decoded = jwt.verify(token, env.refreshTokenSecret) as { userId: string };
    const user = await User.findById(decoded.userId);
    if (!user) throw AppError.unauthorized('Invalid refresh token');
    return generateTokens(String(user._id));
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw AppError.unauthorized('Invalid or expired refresh token');
  }
};

export const AuthService = { register, login, refreshToken };
