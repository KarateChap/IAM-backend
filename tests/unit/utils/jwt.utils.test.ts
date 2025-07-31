import jwt from 'jsonwebtoken';
import { generateToken, verifyToken, extractTokenFromHeader, JwtCustomPayload } from '../../../src/utils/jwt.utils';
import { mockUser } from '../../helpers/mockData';

// Mock jwt module
jest.mock('jsonwebtoken');
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

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
      mockedJwt.sign.mockReturnValue('mock-token' as any);

      // Act
      const token = generateToken(mockUser as any);

      // Assert
      expect(mockedJwt.sign).toHaveBeenCalledWith(
        {
          id: mockUser.id,
          username: mockUser.username,
          email: mockUser.email
        },
        'test-secret',
        { expiresIn: '1h' }
      );
      expect(token).toBe('mock-token');
    });

    it('should use fallback values when env vars not set', () => {
      // Arrange
      delete process.env.JWT_SECRET;
      delete process.env.JWT_EXPIRES_IN;
      mockedJwt.sign.mockReturnValue('mock-token' as any);

      // Act
      const token = generateToken(mockUser as any);

      // Assert
      expect(mockedJwt.sign).toHaveBeenCalledWith(
        expect.any(Object),
        'fallback_jwt_secret',
        { expiresIn: '24h' }
      );
    });
  });

  describe('verifyToken', () => {
    const mockPayload: JwtCustomPayload = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com'
    };

    it('should verify valid token', () => {
      // Arrange
      process.env.JWT_SECRET = 'test-secret';
      mockedJwt.verify.mockReturnValue(mockPayload as any);

      // Act
      const result = verifyToken('valid-token');

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
      const result = verifyToken('invalid-token');

      // Assert
      expect(result).toBeNull();
    });

    it('should use fallback secret when env var not set', () => {
      // Arrange
      delete process.env.JWT_SECRET;
      mockedJwt.verify.mockReturnValue(mockPayload as any);

      // Act
      verifyToken('token');

      // Assert
      expect(mockedJwt.verify).toHaveBeenCalledWith('token', 'fallback_jwt_secret');
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from valid Bearer header', () => {
      // Act
      const result = extractTokenFromHeader('Bearer abc123token');

      // Assert
      expect(result).toBe('abc123token');
    });

    it('should return null for missing header', () => {
      // Act
      const result = extractTokenFromHeader(undefined);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null for invalid header format', () => {
      // Act
      const result1 = extractTokenFromHeader('InvalidFormat abc123');
      const result2 = extractTokenFromHeader('Bearer');
      const result3 = extractTokenFromHeader('Bearer ');

      // Assert
      expect(result1).toBeNull();
      expect(result2).toBeNull();
      expect(result3).toBe(''); // Bearer with space returns empty string
    });

    it('should return null for empty string', () => {
      // Act
      const result = extractTokenFromHeader('');

      // Assert
      expect(result).toBeNull();
    });

    it('should handle Bearer with multiple spaces', () => {
      // Act
      const result = extractTokenFromHeader('Bearer   token123');

      // Assert
      expect(result).toBe('  token123');
    });
  });
});
