import { Request, Response, NextFunction } from 'express';
import { extractTokenFromHeader, verifyToken } from '../../../src/utils/jwt.utils';
import User from '../../../src/models/user.model';
import { createMockRequest, createMockResponse, createMockNext } from '../../helpers/testUtils';
import { mockUser, mockJwtPayload } from '../../helpers/mockData';

// Create mock instances first
const mockUserPermissionControllerInstance = {
  checkPermission: jest.fn()
};

// Mock dependencies
jest.mock('../../../src/utils/jwt.utils');
jest.mock('../../../src/models/user.model');
jest.mock('../../../src/controllers/userPermission.controller', () => {
  return class MockUserPermissionController {
    checkPermission = mockUserPermissionControllerInstance.checkPermission;
  };
});

// Import middleware functions AFTER mocks
import { requireAuth, checkPermission } from '../../../src/middlewares/auth.middleware';

const mockedExtractTokenFromHeader = extractTokenFromHeader as jest.MockedFunction<typeof extractTokenFromHeader>;
const mockedVerifyToken = verifyToken as jest.MockedFunction<typeof verifyToken>;
const MockedUser = User as jest.Mocked<typeof User>;

describe('AuthMiddleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = createMockRequest();
    res = createMockResponse();
    next = createMockNext();
    jest.clearAllMocks();
  });

  describe('requireAuth', () => {
    it('should authenticate user with valid token', async () => {
      // Arrange
      req.headers = { authorization: 'Bearer valid-token' };
      mockedExtractTokenFromHeader.mockReturnValue('valid-token');
      mockedVerifyToken.mockReturnValue(mockJwtPayload);
      MockedUser.findByPk.mockResolvedValue(mockUser as any);

      // Act
      await requireAuth(req as Request, res as Response, next);

      // Assert
      expect(mockedExtractTokenFromHeader).toHaveBeenCalledWith('Bearer valid-token');
      expect(mockedVerifyToken).toHaveBeenCalledWith('valid-token');
      expect(MockedUser.findByPk).toHaveBeenCalledWith(mockJwtPayload.id);
      expect(req.user).toBe(mockUser);
      expect(req.userId).toBe(mockJwtPayload.id);
      expect(next).toHaveBeenCalled();
    });

    it('should return 401 when no token provided', async () => {
      // Arrange
      req.headers = {};
      mockedExtractTokenFromHeader.mockReturnValue(null);

      // Act
      await requireAuth(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required. No token provided.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when token is invalid', async () => {
      // Arrange
      req.headers = { authorization: 'Bearer invalid-token' };
      mockedExtractTokenFromHeader.mockReturnValue('invalid-token');
      mockedVerifyToken.mockReturnValue(null);

      // Act
      await requireAuth(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired token.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when user not found', async () => {
      // Arrange
      req.headers = { authorization: 'Bearer valid-token' };
      mockedExtractTokenFromHeader.mockReturnValue('valid-token');
      mockedVerifyToken.mockReturnValue(mockJwtPayload);
      MockedUser.findByPk.mockResolvedValue(null);

      // Act
      await requireAuth(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      // Arrange
      req.headers = { authorization: 'Bearer valid-token' };
      mockedExtractTokenFromHeader.mockReturnValue('valid-token');
      mockedVerifyToken.mockReturnValue(mockJwtPayload);
      MockedUser.findByPk.mockRejectedValue(new Error('Database error'));

      // Act
      await requireAuth(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error during authentication.'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('checkPermission', () => {
    it('should allow access when user has permission', async () => {
      // Arrange
      req.user = { id: 1 } as any;
      const mockMiddleware = jest.fn((req, res, next) => next());
      mockUserPermissionControllerInstance.checkPermission.mockReturnValue(mockMiddleware);
      
      const middleware = checkPermission('Users', 'create');

      // Act
      await middleware(req as Request, res as Response, next);

      // Assert
      expect(mockUserPermissionControllerInstance.checkPermission).toHaveBeenCalledWith('Users', 'create');
      expect(mockMiddleware).toHaveBeenCalledWith(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should deny access when user lacks permission', async () => {
      // Arrange
      req.user = { id: 1 } as any;
      const mockError = new Error('Permission denied');
      const mockMiddleware = jest.fn((req, res, next) => next(mockError));
      mockUserPermissionControllerInstance.checkPermission.mockReturnValue(mockMiddleware);
      
      const middleware = checkPermission('Users', 'create');

      // Act
      await middleware(req as Request, res as Response, next);

      // Assert
      expect(mockUserPermissionControllerInstance.checkPermission).toHaveBeenCalledWith('Users', 'create');
      expect(mockMiddleware).toHaveBeenCalledWith(req, res, next);
      expect(next).toHaveBeenCalledWith(mockError);
    });

    it('should return 401 when user not authenticated', async () => {
      // Arrange
      req.user = undefined;
      const mockMiddleware = jest.fn((req, res, next) => {
        const error = new Error('User not authenticated');
        error.name = 'UnauthorizedError';
        next(error);
      });
      mockUserPermissionControllerInstance.checkPermission.mockReturnValue(mockMiddleware);
      
      const middleware = checkPermission('Users', 'create');

      // Act
      await middleware(req as Request, res as Response, next);

      // Assert
      expect(mockUserPermissionControllerInstance.checkPermission).toHaveBeenCalledWith('Users', 'create');
      expect(mockMiddleware).toHaveBeenCalledWith(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle permission check errors', async () => {
      // Arrange
      req.user = { id: 1 } as any;
      const mockError = new Error('Permission check failed');
      const mockMiddleware = jest.fn((req, res, next) => next(mockError));
      mockUserPermissionControllerInstance.checkPermission.mockReturnValue(mockMiddleware);
      
      const middleware = checkPermission('Users', 'create');

      // Act
      await middleware(req as Request, res as Response, next);

      // Assert
      expect(mockUserPermissionControllerInstance.checkPermission).toHaveBeenCalledWith('Users', 'create');
      expect(mockMiddleware).toHaveBeenCalledWith(req, res, next);
      expect(next).toHaveBeenCalledWith(mockError);
    });
  });
});
