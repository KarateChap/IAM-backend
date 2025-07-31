import { AuthService, RegisterUserData, LoginCredentials } from '../../../src/services/auth.service';
import User from '../../../src/models/user.model';
import { generateToken } from '../../../src/utils/jwt.utils';
import { ConflictError, UnauthorizedError } from '../../../src/utils/errors';
import { mockUser } from '../../helpers/mockData';

// Mock dependencies
jest.mock('../../../src/models/user.model');
jest.mock('../../../src/utils/jwt.utils');

const MockedUser = User as jest.Mocked<typeof User>;
const mockedGenerateToken = generateToken as jest.MockedFunction<typeof generateToken>;

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    const validUserData: RegisterUserData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User'
    };

    it('should successfully register a new user', async () => {
      // Arrange
      MockedUser.findOne.mockResolvedValue(null);
      MockedUser.create.mockResolvedValue(mockUser as any);
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
      expect(mockedGenerateToken).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual({
        user: {
          id: mockUser.id,
          username: mockUser.username,
          email: mockUser.email,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName
        },
        token: 'mock-jwt-token'
      });
    });

    it('should throw ConflictError if email already exists', async () => {
      // Arrange
      const existingUser = { ...mockUser, get: jest.fn((key) => key === 'email' ? validUserData.email : mockUser[key as keyof typeof mockUser]) };
      MockedUser.findOne.mockResolvedValue(existingUser as any);

      // Act & Assert
      await expect(authService.registerUser(validUserData))
        .rejects
        .toThrow(new ConflictError('Email already registered'));
    });

    it('should throw ConflictError if username already exists', async () => {
      // Arrange
      const existingUser = { 
        ...mockUser, 
        get: jest.fn((key) => {
          if (key === 'email') return 'different@example.com';
          if (key === 'username') return validUserData.username;
          return mockUser[key as keyof typeof mockUser];
        })
      };
      MockedUser.findOne.mockResolvedValue(existingUser as any);

      // Act & Assert
      await expect(authService.registerUser(validUserData))
        .rejects
        .toThrow(new ConflictError('Username already taken'));
    });
  });

  describe('loginUser', () => {
    const validCredentials: LoginCredentials = {
      email: 'test@example.com',
      password: 'password123'
    };

    it('should successfully login a user with valid credentials', async () => {
      // Arrange
      const userWithValidatePassword = {
        ...mockUser,
        validatePassword: jest.fn().mockResolvedValue(true)
      };
      MockedUser.findOne.mockResolvedValue(userWithValidatePassword as any);
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
          id: mockUser.id,
          username: mockUser.username,
          email: mockUser.email,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName
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
        .toThrow(new UnauthorizedError('Invalid email or password'));
    });

    it('should throw UnauthorizedError if user is inactive', async () => {
      // Arrange
      const inactiveUser = {
        ...mockUser,
        get: jest.fn((key) => key === 'isActive' ? false : mockUser[key as keyof typeof mockUser])
      };
      MockedUser.findOne.mockResolvedValue(inactiveUser as any);

      // Act & Assert
      await expect(authService.loginUser(validCredentials))
        .rejects
        .toThrow(new UnauthorizedError('Account is deactivated'));
    });

    it('should throw UnauthorizedError if password is invalid', async () => {
      // Arrange
      const userWithInvalidPassword = {
        ...mockUser,
        validatePassword: jest.fn().mockResolvedValue(false)
      };
      MockedUser.findOne.mockResolvedValue(userWithInvalidPassword as any);

      // Act & Assert
      await expect(authService.loginUser(validCredentials))
        .rejects
        .toThrow(new UnauthorizedError('Invalid email or password'));
    });
  });
});
