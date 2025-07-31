import { Request, Response, NextFunction } from 'express';
import { extractTokenFromHeader, verifyToken } from '../utils/jwt.utils';
import User from '../models/user.model';
import UserPermissionController from '../controllers/userPermission.controller';

// Extend Express Request interface to include the user property
declare global {
  namespace Express {
    interface Request {
      user?: User;
      userId?: number;
    }
  }
}

/**
 * Authentication middleware to protect routes
 * Verifies JWT token and attaches user to request object
 */
export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get authorization header
    const authHeader = req.headers.authorization;
    
    // Extract token
    const token = extractTokenFromHeader(authHeader);
    
    if (!token) {
      res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
      return;
    }
    
    // Verify token
    const decoded = verifyToken(token);
    
    if (!decoded) {
      res.status(401).json({ success: false, message: 'Invalid or expired token.' });
      return;
    }
    
    // Find the user and attach to request
    const user = await User.findByPk(decoded.id);
    if (!user) {
      res.status(401).json({ success: false, message: 'User not found.' });
      return;
    }
    
    // Attach user and userId to request for further use
    req.user = user;
    req.userId = decoded.id;
    
    // Continue to the protected route
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ message: 'Server error during authentication.' });
  }
};

/**
 * Permission-based middleware factory
 * Creates middleware to check if user has specific permission
 */
export const checkPermission = (module: string | number, action: string) => {
  const userPermissionController = new UserPermissionController();
  return userPermissionController.checkPermission(module, action);
};

/**
 * Optional authentication middleware
 * If token is present and valid, attaches user to request
 * Does not fail if token is missing or invalid
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);
    
    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        req.userId = decoded.id;
      }
    }
    
    next();
  } catch (error) {
    // Just proceed without authentication
    next();
  }
};
