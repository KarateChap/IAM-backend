"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jwt_utils_1 = require("../../../src/utils/jwt.utils");
const user_model_1 = __importDefault(require("../../../src/models/user.model"));
const testUtils_1 = require("../../helpers/testUtils");
const mockData_1 = require("../../helpers/mockData");
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
const auth_middleware_1 = require("../../../src/middlewares/auth.middleware");
const mockedExtractTokenFromHeader = jwt_utils_1.extractTokenFromHeader;
const mockedVerifyToken = jwt_utils_1.verifyToken;
const MockedUser = user_model_1.default;
describe('AuthMiddleware', () => {
    let req;
    let res;
    let next;
    beforeEach(() => {
        req = (0, testUtils_1.createMockRequest)();
        res = (0, testUtils_1.createMockResponse)();
        next = (0, testUtils_1.createMockNext)();
        jest.clearAllMocks();
    });
    describe('requireAuth', () => {
        it('should authenticate user with valid token', async () => {
            // Arrange
            req.headers = { authorization: 'Bearer valid-token' };
            mockedExtractTokenFromHeader.mockReturnValue('valid-token');
            mockedVerifyToken.mockReturnValue(mockData_1.mockJwtPayload);
            MockedUser.findByPk.mockResolvedValue(mockData_1.mockUser);
            // Act
            await (0, auth_middleware_1.requireAuth)(req, res, next);
            // Assert
            expect(mockedExtractTokenFromHeader).toHaveBeenCalledWith('Bearer valid-token');
            expect(mockedVerifyToken).toHaveBeenCalledWith('valid-token');
            expect(MockedUser.findByPk).toHaveBeenCalledWith(mockData_1.mockJwtPayload.id);
            expect(req.user).toBe(mockData_1.mockUser);
            expect(req.userId).toBe(mockData_1.mockJwtPayload.id);
            expect(next).toHaveBeenCalled();
        });
        it('should return 401 when no token provided', async () => {
            // Arrange
            req.headers = {};
            mockedExtractTokenFromHeader.mockReturnValue(null);
            // Act
            await (0, auth_middleware_1.requireAuth)(req, res, next);
            // Assert
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
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
            await (0, auth_middleware_1.requireAuth)(req, res, next);
            // Assert
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Invalid or expired token.'
            });
            expect(next).not.toHaveBeenCalled();
        });
        it('should return 401 when user not found', async () => {
            // Arrange
            req.headers = { authorization: 'Bearer valid-token' };
            mockedExtractTokenFromHeader.mockReturnValue('valid-token');
            mockedVerifyToken.mockReturnValue(mockData_1.mockJwtPayload);
            MockedUser.findByPk.mockResolvedValue(null);
            // Act
            await (0, auth_middleware_1.requireAuth)(req, res, next);
            // Assert
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                message: 'User not found.'
            });
            expect(next).not.toHaveBeenCalled();
        });
        it('should handle errors gracefully', async () => {
            // Arrange
            req.headers = { authorization: 'Bearer valid-token' };
            mockedExtractTokenFromHeader.mockReturnValue('valid-token');
            mockedVerifyToken.mockReturnValue(mockData_1.mockJwtPayload);
            MockedUser.findByPk.mockRejectedValue(new Error('Database error'));
            // Act
            await (0, auth_middleware_1.requireAuth)(req, res, next);
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
            req.user = { id: 1 };
            const mockMiddleware = jest.fn((req, res, next) => next());
            mockUserPermissionControllerInstance.checkPermission.mockReturnValue(mockMiddleware);
            const middleware = (0, auth_middleware_1.checkPermission)('Users', 'create');
            // Act
            await middleware(req, res, next);
            // Assert
            expect(mockUserPermissionControllerInstance.checkPermission).toHaveBeenCalledWith('Users', 'create');
            expect(mockMiddleware).toHaveBeenCalledWith(req, res, next);
            expect(next).toHaveBeenCalled();
        });
        it('should deny access when user lacks permission', async () => {
            // Arrange
            req.user = { id: 1 };
            const mockError = new Error('Permission denied');
            const mockMiddleware = jest.fn((req, res, next) => next(mockError));
            mockUserPermissionControllerInstance.checkPermission.mockReturnValue(mockMiddleware);
            const middleware = (0, auth_middleware_1.checkPermission)('Users', 'create');
            // Act
            await middleware(req, res, next);
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
            const middleware = (0, auth_middleware_1.checkPermission)('Users', 'create');
            // Act
            await middleware(req, res, next);
            // Assert
            expect(mockUserPermissionControllerInstance.checkPermission).toHaveBeenCalledWith('Users', 'create');
            expect(mockMiddleware).toHaveBeenCalledWith(req, res, next);
            expect(next).toHaveBeenCalledWith(expect.any(Error));
        });
        it('should handle permission check errors', async () => {
            // Arrange
            req.user = { id: 1 };
            const mockError = new Error('Permission check failed');
            const mockMiddleware = jest.fn((req, res, next) => next(mockError));
            mockUserPermissionControllerInstance.checkPermission.mockReturnValue(mockMiddleware);
            const middleware = (0, auth_middleware_1.checkPermission)('Users', 'create');
            // Act
            await middleware(req, res, next);
            // Assert
            expect(mockUserPermissionControllerInstance.checkPermission).toHaveBeenCalledWith('Users', 'create');
            expect(mockMiddleware).toHaveBeenCalledWith(req, res, next);
            expect(next).toHaveBeenCalledWith(mockError);
        });
    });
});
