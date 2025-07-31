import jwt from 'jsonwebtoken';
import { User } from '../models/user.model';

// JWT payload interface
export interface JwtCustomPayload {
  id: number;
  username: string;
  email: string;
}

/**
 * Generates a JWT token for a user
 * @param user User object
 * @returns JWT token
 */
export const generateToken = (user: User): string => {
  const payload: JwtCustomPayload = {
    id: user.id,
    username: user.username,
    email: user.email,
  };

  const jwtSecret = process.env.JWT_SECRET || 'fallback_jwt_secret';
  const expiresIn = (process.env.JWT_EXPIRES_IN || '24h') as jwt.SignOptions['expiresIn'];

  return jwt.sign(payload, jwtSecret, { expiresIn });
};

/**
 * Verifies a JWT token
 * @param token JWT token
 * @returns Decoded token payload or null if invalid
 */
export const verifyToken = (token: string): JwtCustomPayload | null => {
  try {
    const jwtSecret = process.env.JWT_SECRET || 'fallback_jwt_secret';
    return jwt.verify(token, jwtSecret) as JwtCustomPayload;
  } catch {
    return null;
  }
};

/**
 * Extracts token from request headers
 * @param authHeader Authorization header value
 * @returns JWT token or null if not found
 */
export const extractTokenFromHeader = (authHeader?: string): string | null => {
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
};
