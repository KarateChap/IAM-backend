"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_validator_1 = require("express-validator");
const errors_1 = require("../../../src/utils/errors");
const testUtils_1 = require("../../helpers/testUtils");
const mockData_1 = require("../../helpers/mockData");
// Create mock instances first
const mockAuthServiceInstance = {
    registerUser: jest.fn(),
    loginUser: jest.fn(),
};
const mockAuditServiceInstance = {
    logEvent: jest.fn(),
};
// Mock dependencies
jest.mock('express-validator');
jest.mock('../../../src/services', () => ({
    authService: mockAuthServiceInstance,
    auditService: mockAuditServiceInstance,
}));
// Import controller functions AFTER mocks
const auth_controller_1 = require("../../../src/controllers/auth.controller");
const mockedValidationResult = express_validator_1.validationResult;
describe('AuthController', () => {
    let req;
    let res;
    let next;
    beforeEach(() => {
        req = (0, testUtils_1.createMockRequest)();
        res = (0, testUtils_1.createMockResponse)();
        next = (0, testUtils_1.createMockNext)();
        jest.clearAllMocks();
        // Reset mock implementations
        mockAuthServiceInstance.registerUser.mockReset();
        mockAuthServiceInstance.loginUser.mockReset();
        mockAuditServiceInstance.logEvent.mockReset();
    });
    describe('register', () => {
        const validRegistrationData = {
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123',
            firstName: 'Test',
            lastName: 'User'
        };
        it('should register user successfully', async () => {
            // Arrange
            req.body = validRegistrationData;
            mockedValidationResult.mockReturnValue((0, testUtils_1.createMockValidationResult)());
            const authResult = {
                user: {
                    id: 1,
                    username: 'testuser',
                    email: 'test@example.com',
                    firstName: 'Test',
                    lastName: 'User'
                },
                token: 'mock-jwt-token'
            };
            mockAuthServiceInstance.registerUser.mockResolvedValue(authResult);
            mockAuditServiceInstance.logEvent.mockResolvedValue(undefined);
            // Act
            await (0, auth_controller_1.register)(req, res, next);
            // Assert
            expect(mockedValidationResult).toHaveBeenCalledWith(req);
            expect(mockAuthServiceInstance.registerUser).toHaveBeenCalledWith(validRegistrationData);
            expect(mockAuditServiceInstance.logEvent).toHaveBeenCalledWith({
                userId: authResult.user.id,
                action: 'USER_REGISTERED',
                resource: 'users',
                resourceId: authResult.user.id,
                details: { username: validRegistrationData.username, email: validRegistrationData.email }
            });
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'User registered successfully',
                data: {
                    user: authResult.user,
                    token: authResult.token
                }
            });
        });
        it('should handle validation errors', async () => {
            // Arrange
            req.body = { email: 'invalid-email' };
            mockedValidationResult.mockReturnValue((0, testUtils_1.createMockValidationResult)(mockData_1.mockValidationErrors));
            // Act
            await (0, auth_controller_1.register)(req, res, next);
            // Assert
            expect(next).toHaveBeenCalledWith(expect.any(errors_1.ValidationError));
            expect(mockAuthServiceInstance.registerUser).not.toHaveBeenCalled();
        });
        it('should handle service errors', async () => {
            // Arrange
            req.body = validRegistrationData;
            mockedValidationResult.mockReturnValue((0, testUtils_1.createMockValidationResult)());
            const serviceError = new Error('Service error');
            mockAuthServiceInstance.registerUser.mockRejectedValue(serviceError);
            // Act
            await (0, auth_controller_1.register)(req, res, next);
            // Assert
            expect(next).toHaveBeenCalledWith(serviceError);
        });
    });
    describe('login', () => {
        const validLoginData = {
            email: 'test@example.com',
            password: 'password123'
        };
        it('should login user successfully', async () => {
            // Arrange
            req.body = validLoginData;
            mockedValidationResult.mockReturnValue((0, testUtils_1.createMockValidationResult)());
            const authResult = {
                user: {
                    id: 1,
                    username: 'testuser',
                    email: 'test@example.com',
                    firstName: 'Test',
                    lastName: 'User'
                },
                token: 'mock-jwt-token'
            };
            mockAuthServiceInstance.loginUser.mockResolvedValue(authResult);
            mockAuditServiceInstance.logEvent.mockResolvedValue(undefined);
            // Act
            await (0, auth_controller_1.login)(req, res, next);
            // Assert
            expect(mockedValidationResult).toHaveBeenCalledWith(req);
            expect(mockAuthServiceInstance.loginUser).toHaveBeenCalledWith(validLoginData);
            expect(mockAuditServiceInstance.logEvent).toHaveBeenCalledWith({
                userId: authResult.user.id,
                action: 'USER_LOGIN',
                resource: 'auth',
                details: { email: validLoginData.email }
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Login successful',
                data: {
                    user: authResult.user,
                    token: authResult.token
                }
            });
        });
        it('should handle validation errors', async () => {
            // Arrange
            req.body = { email: 'invalid-email' };
            mockedValidationResult.mockReturnValue((0, testUtils_1.createMockValidationResult)(mockData_1.mockValidationErrors));
            // Act
            await (0, auth_controller_1.login)(req, res, next);
            // Assert
            expect(next).toHaveBeenCalledWith(expect.any(errors_1.ValidationError));
            expect(mockAuthServiceInstance.loginUser).not.toHaveBeenCalled();
        });
        it('should handle authentication errors', async () => {
            // Arrange
            req.body = validLoginData;
            mockedValidationResult.mockReturnValue((0, testUtils_1.createMockValidationResult)());
            const authError = new Error('Invalid credentials');
            mockAuthServiceInstance.loginUser.mockRejectedValue(authError);
            // Act
            await (0, auth_controller_1.login)(req, res, next);
            // Assert
            expect(next).toHaveBeenCalledWith(authError);
        });
    });
});
