"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const auth_routes_1 = __importDefault(require("../../src/routes/auth.routes"));
const errorHandler_middleware_1 = require("../../src/middlewares/errorHandler.middleware");
const user_model_1 = __importDefault(require("../../src/models/user.model"));
// Create test app
const createTestApp = () => {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.use('/api/auth', auth_routes_1.default);
    app.use(errorHandler_middleware_1.errorHandler);
    return app;
};
// Mock database and models
jest.mock('../../src/models/user.model');
jest.mock('../../src/utils/jwt.utils', () => ({
    generateToken: jest.fn(() => 'mock-jwt-token'),
    verifyToken: jest.fn(),
}));
// Mock bcryptjs
jest.mock('bcryptjs', () => ({
    hash: jest.fn().mockResolvedValue('hashed-password'),
    compare: jest.fn().mockResolvedValue(true),
}));
// Note: Not mocking validators to test real validation behavior
// Mock services index
jest.mock('../../src/services', () => ({
    authService: {
        registerUser: jest.fn(),
        loginUser: jest.fn(),
    },
    auditService: {
        logEvent: jest.fn().mockResolvedValue(undefined),
    },
}));
const MockedUser = user_model_1.default;
// Import mocked services
const { authService } = require('../../src/services');
const mockedAuthService = authService;
describe('Auth Integration Tests', () => {
    let app;
    beforeEach(() => {
        app = createTestApp();
        jest.clearAllMocks();
    });
    describe('POST /api/auth/register', () => {
        const validRegistrationData = {
            username: 'testuser',
            email: 'test@example.com',
            password: 'Password123!',
            firstName: 'Test',
            lastName: 'User'
        };
        it('should register user with valid data', async () => {
            // Arrange
            const mockResult = {
                user: {
                    id: 1,
                    username: 'testuser',
                    email: 'test@example.com',
                    firstName: 'Test',
                    lastName: 'User'
                },
                token: 'mock-jwt-token'
            };
            mockedAuthService.registerUser.mockResolvedValue(mockResult);
            // Act
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/register')
                .send(validRegistrationData);
            // Assert
            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('User registered successfully');
            expect(response.body.data).toHaveProperty('user');
            expect(response.body.data).toHaveProperty('token');
        });
        it('should return 422 for invalid email', async () => {
            // Act
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/register')
                .send({
                ...validRegistrationData,
                email: 'invalid-email'
            });
            // Assert
            expect(response.status).toBe(422);
            expect(response.body.success).toBe(false);
        });
        it('should return 422 for missing required fields', async () => {
            // Act
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/register')
                .send({
                email: 'test@example.com'
                // Missing username and password
            });
            // Assert
            expect(response.status).toBe(422);
            expect(response.body.success).toBe(false);
        });
        it('should return 422 for weak password', async () => {
            // Act
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/register')
                .send({
                ...validRegistrationData,
                password: '123' // Too weak
            });
            // Assert
            expect(response.status).toBe(422);
            expect(response.body.success).toBe(false);
        });
    });
    describe('POST /api/auth/login', () => {
        const validLoginData = {
            email: 'test@example.com',
            password: 'Password123!'
        };
        it('should login user with valid credentials', async () => {
            // Arrange
            const mockResult = {
                user: {
                    id: 1,
                    username: 'testuser',
                    email: 'test@example.com',
                    firstName: 'Test',
                    lastName: 'User'
                },
                token: 'mock-jwt-token'
            };
            mockedAuthService.loginUser.mockResolvedValue(mockResult);
            // Act
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/login')
                .send(validLoginData);
            // Assert
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Login successful');
            expect(response.body.data).toHaveProperty('user');
            expect(response.body.data).toHaveProperty('token');
        });
        it('should return 422 for invalid email format', async () => {
            // Act
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/login')
                .send({
                email: 'invalid-email',
                password: 'Password123!'
            });
            // Assert
            expect(response.status).toBe(422);
            expect(response.body.success).toBe(false);
        });
        it('should return 422 for missing credentials', async () => {
            // Act
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/login')
                .send({
                email: 'test@example.com'
                // Missing password
            });
            // Assert
            expect(response.status).toBe(422);
            expect(response.body.success).toBe(false);
        });
        it('should handle user not found', async () => {
            // Arrange
            const { UnauthorizedError } = require('../../src/utils/errors');
            mockedAuthService.loginUser.mockRejectedValue(new UnauthorizedError('Invalid credentials'));
            // Act
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/login')
                .send(validLoginData);
            // Assert
            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });
        it('should handle inactive user', async () => {
            // Arrange
            const { UnauthorizedError } = require('../../src/utils/errors');
            mockedAuthService.loginUser.mockRejectedValue(new UnauthorizedError('Account is inactive'));
            // Act
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/login')
                .send(validLoginData);
            // Assert
            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });
    });
    describe('Error handling', () => {
        it('should handle internal server errors gracefully', async () => {
            // Arrange
            MockedUser.findOne.mockRejectedValue(new Error('Database connection failed'));
            // Act
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/login')
                .send({
                email: 'test@example.com',
                password: 'Password123!'
            });
            // Assert
            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
        });
        it('should handle malformed JSON gracefully', async () => {
            // Act
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/register')
                .set('Content-Type', 'application/json')
                .send('{"invalid": json}');
            // Assert
            expect(response.status).toBe(400);
        });
    });
});
