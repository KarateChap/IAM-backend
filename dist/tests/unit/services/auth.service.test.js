"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const auth_service_1 = require("../../../src/services/auth.service");
const user_model_1 = __importDefault(require("../../../src/models/user.model"));
const jwt_utils_1 = require("../../../src/utils/jwt.utils");
const errors_1 = require("../../../src/utils/errors");
const mockData_1 = require("../../helpers/mockData");
// Mock dependencies
jest.mock('../../../src/models/user.model');
jest.mock('../../../src/utils/jwt.utils');
const MockedUser = user_model_1.default;
const mockedGenerateToken = jwt_utils_1.generateToken;
describe('AuthService', () => {
    let authService;
    beforeEach(() => {
        authService = new auth_service_1.AuthService();
        jest.clearAllMocks();
    });
    describe('registerUser', () => {
        const validUserData = {
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123',
            firstName: 'Test',
            lastName: 'User'
        };
        it('should successfully register a new user', async () => {
            // Arrange
            MockedUser.findOne.mockResolvedValue(null);
            MockedUser.create.mockResolvedValue(mockData_1.mockUser);
            mockedGenerateToken.mockReturnValue('mock-jwt-token');
            // Act
            const result = await authService.registerUser(validUserData);
            // Assert
            expect(MockedUser.findOne).toHaveBeenCalledWith({
                where: {
                    [Symbol.for('or')]: [
                        { email: validUserData.email },
                        { username: validUserData.username }
                    ]
                }
            });
            expect(MockedUser.create).toHaveBeenCalledWith({
                username: validUserData.username,
                email: validUserData.email,
                password: validUserData.password,
                firstName: validUserData.firstName,
                lastName: validUserData.lastName,
                isActive: true
            });
            expect(mockedGenerateToken).toHaveBeenCalledWith(mockData_1.mockUser);
            expect(result).toEqual({
                user: {
                    id: mockData_1.mockUser.id,
                    username: mockData_1.mockUser.username,
                    email: mockData_1.mockUser.email,
                    firstName: mockData_1.mockUser.firstName,
                    lastName: mockData_1.mockUser.lastName
                },
                token: 'mock-jwt-token'
            });
        });
        it('should throw ConflictError if email already exists', async () => {
            // Arrange
            const existingUser = { ...mockData_1.mockUser, get: jest.fn((key) => key === 'email' ? validUserData.email : mockData_1.mockUser[key]) };
            MockedUser.findOne.mockResolvedValue(existingUser);
            // Act & Assert
            await expect(authService.registerUser(validUserData))
                .rejects
                .toThrow(new errors_1.ConflictError('Email already registered'));
        });
        it('should throw ConflictError if username already exists', async () => {
            // Arrange
            const existingUser = {
                ...mockData_1.mockUser,
                get: jest.fn((key) => {
                    if (key === 'email')
                        return 'different@example.com';
                    if (key === 'username')
                        return validUserData.username;
                    return mockData_1.mockUser[key];
                })
            };
            MockedUser.findOne.mockResolvedValue(existingUser);
            // Act & Assert
            await expect(authService.registerUser(validUserData))
                .rejects
                .toThrow(new errors_1.ConflictError('Username already taken'));
        });
    });
    describe('loginUser', () => {
        const validCredentials = {
            email: 'test@example.com',
            password: 'password123'
        };
        it('should successfully login a user with valid credentials', async () => {
            // Arrange
            const userWithValidatePassword = {
                ...mockData_1.mockUser,
                validatePassword: jest.fn().mockResolvedValue(true)
            };
            MockedUser.findOne.mockResolvedValue(userWithValidatePassword);
            mockedGenerateToken.mockReturnValue('mock-jwt-token');
            // Act
            const result = await authService.loginUser(validCredentials);
            // Assert
            expect(MockedUser.findOne).toHaveBeenCalledWith({
                where: { email: validCredentials.email }
            });
            expect(userWithValidatePassword.validatePassword).toHaveBeenCalledWith(validCredentials.password);
            expect(mockedGenerateToken).toHaveBeenCalledWith(userWithValidatePassword);
            expect(result).toEqual({
                user: {
                    id: mockData_1.mockUser.id,
                    username: mockData_1.mockUser.username,
                    email: mockData_1.mockUser.email,
                    firstName: mockData_1.mockUser.firstName,
                    lastName: mockData_1.mockUser.lastName
                },
                token: 'mock-jwt-token'
            });
        });
        it('should throw UnauthorizedError if user not found', async () => {
            // Arrange
            MockedUser.findOne.mockResolvedValue(null);
            // Act & Assert
            await expect(authService.loginUser(validCredentials))
                .rejects
                .toThrow(new errors_1.UnauthorizedError('Invalid email or password'));
        });
        it('should throw UnauthorizedError if user is inactive', async () => {
            // Arrange
            const inactiveUser = {
                ...mockData_1.mockUser,
                get: jest.fn((key) => key === 'isActive' ? false : mockData_1.mockUser[key])
            };
            MockedUser.findOne.mockResolvedValue(inactiveUser);
            // Act & Assert
            await expect(authService.loginUser(validCredentials))
                .rejects
                .toThrow(new errors_1.UnauthorizedError('Account is deactivated'));
        });
        it('should throw UnauthorizedError if password is invalid', async () => {
            // Arrange
            const userWithInvalidPassword = {
                ...mockData_1.mockUser,
                validatePassword: jest.fn().mockResolvedValue(false)
            };
            MockedUser.findOne.mockResolvedValue(userWithInvalidPassword);
            // Act & Assert
            await expect(authService.loginUser(validCredentials))
                .rejects
                .toThrow(new errors_1.UnauthorizedError('Invalid email or password'));
        });
    });
});
