"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwt_utils_1 = require("../../../src/utils/jwt.utils");
const mockData_1 = require("../../helpers/mockData");
// Mock jwt module
jest.mock('jsonwebtoken');
const mockedJwt = jsonwebtoken_1.default;
describe('JWT Utils', () => {
    const originalEnv = process.env;
    beforeEach(() => {
        jest.clearAllMocks();
        process.env = { ...originalEnv };
    });
    afterAll(() => {
        process.env = originalEnv;
    });
    describe('generateToken', () => {
        it('should generate token with user data', () => {
            // Arrange
            process.env.JWT_SECRET = 'test-secret';
            process.env.JWT_EXPIRES_IN = '1h';
            mockedJwt.sign.mockReturnValue('mock-token');
            // Act
            const token = (0, jwt_utils_1.generateToken)(mockData_1.mockUser);
            // Assert
            expect(mockedJwt.sign).toHaveBeenCalledWith({
                id: mockData_1.mockUser.id,
                username: mockData_1.mockUser.username,
                email: mockData_1.mockUser.email
            }, 'test-secret', { expiresIn: '1h' });
            expect(token).toBe('mock-token');
        });
        it('should use fallback values when env vars not set', () => {
            // Arrange
            delete process.env.JWT_SECRET;
            delete process.env.JWT_EXPIRES_IN;
            mockedJwt.sign.mockReturnValue('mock-token');
            // Act
            const token = (0, jwt_utils_1.generateToken)(mockData_1.mockUser);
            // Assert
            expect(mockedJwt.sign).toHaveBeenCalledWith(expect.any(Object), 'fallback_jwt_secret', { expiresIn: '24h' });
        });
    });
    describe('verifyToken', () => {
        const mockPayload = {
            id: 1,
            username: 'testuser',
            email: 'test@example.com'
        };
        it('should verify valid token', () => {
            // Arrange
            process.env.JWT_SECRET = 'test-secret';
            mockedJwt.verify.mockReturnValue(mockPayload);
            // Act
            const result = (0, jwt_utils_1.verifyToken)('valid-token');
            // Assert
            expect(mockedJwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
            expect(result).toEqual(mockPayload);
        });
        it('should return null for invalid token', () => {
            // Arrange
            process.env.JWT_SECRET = 'test-secret';
            mockedJwt.verify.mockImplementation(() => {
                throw new Error('Invalid token');
            });
            // Act
            const result = (0, jwt_utils_1.verifyToken)('invalid-token');
            // Assert
            expect(result).toBeNull();
        });
        it('should use fallback secret when env var not set', () => {
            // Arrange
            delete process.env.JWT_SECRET;
            mockedJwt.verify.mockReturnValue(mockPayload);
            // Act
            (0, jwt_utils_1.verifyToken)('token');
            // Assert
            expect(mockedJwt.verify).toHaveBeenCalledWith('token', 'fallback_jwt_secret');
        });
    });
    describe('extractTokenFromHeader', () => {
        it('should extract token from valid Bearer header', () => {
            // Act
            const result = (0, jwt_utils_1.extractTokenFromHeader)('Bearer abc123token');
            // Assert
            expect(result).toBe('abc123token');
        });
        it('should return null for missing header', () => {
            // Act
            const result = (0, jwt_utils_1.extractTokenFromHeader)(undefined);
            // Assert
            expect(result).toBeNull();
        });
        it('should return null for invalid header format', () => {
            // Act
            const result1 = (0, jwt_utils_1.extractTokenFromHeader)('InvalidFormat abc123');
            const result2 = (0, jwt_utils_1.extractTokenFromHeader)('Bearer');
            const result3 = (0, jwt_utils_1.extractTokenFromHeader)('Bearer ');
            // Assert
            expect(result1).toBeNull();
            expect(result2).toBeNull();
            expect(result3).toBe(''); // Bearer with space returns empty string
        });
        it('should return null for empty string', () => {
            // Act
            const result = (0, jwt_utils_1.extractTokenFromHeader)('');
            // Assert
            expect(result).toBeNull();
        });
        it('should handle Bearer with multiple spaces', () => {
            // Act
            const result = (0, jwt_utils_1.extractTokenFromHeader)('Bearer   token123');
            // Assert
            expect(result).toBe('  token123');
        });
    });
});
