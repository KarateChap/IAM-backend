import bcryptjs from 'bcryptjs';
import { Op } from 'sequelize';
import User from '../models/user.model';
import { generateToken } from '../utils/jwt.utils';
import { ConflictError, UnauthorizedError, ValidationError } from '../utils/errors';

export interface RegisterUserData {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResult {
  user: {
    id: number;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  token: string;
}

/**
 * Authentication Service
 * Handles user registration, login, and authentication-related business logic
 */
export class AuthService {
  /**
   * Register a new user
   */
  async registerUser(userData: RegisterUserData): Promise<AuthResult> {
    const { username, email, password, firstName, lastName } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { username }]
      }
    });

    if (existingUser) {
      if (existingUser.get('email') === email) {
        throw new ConflictError('Email already registered');
      }
      if (existingUser.get('username') === username) {
        throw new ConflictError('Username already taken');
      }
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password, // Will be hashed by the model's beforeCreate hook
      firstName,
      lastName,
      isActive: true,
    });

    // Generate JWT token
    const token = generateToken(user);

    return {
      user: {
        id: user.id,
        username: user.get('username'),
        email: user.get('email'),
        firstName: user.get('firstName'),
        lastName: user.get('lastName'),
      },
      token,
    };
  }

  /**
   * Authenticate user login
   */
  async loginUser(credentials: LoginCredentials): Promise<AuthResult> {
    const { email, password } = credentials;

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check if user is active
    if (!user.get('isActive')) {
      throw new UnauthorizedError('Account is deactivated');
    }

    // Validate password
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate JWT token
    const token = generateToken(user);

    return {
      user: {
        id: user.id,
        username: user.get('username'),
        email: user.get('email'),
        firstName: user.get('firstName'),
        lastName: user.get('lastName'),
      },
      token,
    };
  }

  /**
   * Change user password
   */
  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new ValidationError('User not found');
    }

    // Validate current password
    const isValidPassword = await user.validatePassword(currentPassword);
    if (!isValidPassword) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    // Hash and update new password
    const hashedPassword = await bcryptjs.hash(newPassword, 10);
    await user.update({ password: hashedPassword });
  }

  /**
   * Reset user password (admin function)
   */
  async resetPassword(userId: number, newPassword: string): Promise<void> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new ValidationError('User not found');
    }

    // Hash and update new password
    const hashedPassword = await bcryptjs.hash(newPassword, 10);
    await user.update({ password: hashedPassword });
  }

  /**
   * Deactivate user account
   */
  async deactivateUser(userId: number): Promise<void> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new ValidationError('User not found');
    }

    await user.update({ isActive: false });
  }

  /**
   * Activate user account
   */
  async activateUser(userId: number): Promise<void> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new ValidationError('User not found');
    }

    await user.update({ isActive: true });
  }
}

export default new AuthService();
