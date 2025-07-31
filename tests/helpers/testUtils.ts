import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

// Extend Request interface to include user property
interface RequestWithUser extends Request {
  user?: any;
}

// Mock Express Request object
export const createMockRequest = (overrides: Partial<RequestWithUser> = {}): Partial<RequestWithUser> => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  user: undefined,
  ...overrides
});

// Mock Express Response object
export const createMockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis()
  };
  return res;
};

// Mock Next Function
export const createMockNext = (): NextFunction => jest.fn();

// Generate test JWT token
export const generateTestToken = (payload: any): string => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
};

// Mock Sequelize model methods
export const createMockModel = (data: any = {}) => ({
  findAll: jest.fn(),
  findByPk: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
  count: jest.fn(),
  ...data
});

// Mock validation result
export const createMockValidationResult = (errors: any[] = []) => ({
  isEmpty: jest.fn().mockReturnValue(errors.length === 0),
  array: jest.fn().mockReturnValue(errors),
  formatWith: jest.fn().mockReturnValue({ array: () => errors }),
  mapped: jest.fn().mockReturnValue({}),
  throw: jest.fn()
} as any);

// Helper to create authenticated request
export const createAuthenticatedRequest = (user: any, overrides: Partial<RequestWithUser> = {}): Partial<RequestWithUser> => ({
  ...createMockRequest(overrides),
  user,
  headers: {
    authorization: `Bearer ${generateTestToken(user)}`,
    ...overrides.headers
  }
});

// Helper to test async middleware/controllers
export const testAsyncFunction = async (
  fn: Function,
  req: Partial<Request>,
  res: Partial<Response>,
  next: NextFunction
) => {
  try {
    await fn(req, res, next);
  } catch (error) {
    next(error);
  }
};
