"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const sequelize_1 = require("sequelize");
const user_model_1 = __importDefault(require("../models/user.model"));
const jwt_utils_1 = require("../utils/jwt.utils");
const errors_1 = require("../utils/errors");
/**
 * Authentication Service
 * Handles user registration, login, and authentication-related business logic
 */
class AuthService {
    /**
     * Register a new user
     */
    async registerUser(userData) {
        const { username, email, password, firstName, lastName } = userData;
        // Check if user already exists
        const existingUser = await user_model_1.default.findOne({
            where: {
                [sequelize_1.Op.or]: [{ email }, { username }]
            }
        });
        if (existingUser) {
            if (existingUser.get('email') === email) {
                throw new errors_1.ConflictError('Email already registered');
            }
            if (existingUser.get('username') === username) {
                throw new errors_1.ConflictError('Username already taken');
            }
        }
        // Create user
        const user = await user_model_1.default.create({
            username,
            email,
            password, // Will be hashed by the model's beforeCreate hook
            firstName,
            lastName,
            isActive: true,
        });
        // Generate JWT token
        const token = (0, jwt_utils_1.generateToken)(user);
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
    async loginUser(credentials) {
        const { email, password } = credentials;
        // Find user by email
        const user = await user_model_1.default.findOne({ where: { email } });
        if (!user) {
            throw new errors_1.UnauthorizedError('Invalid email or password');
        }
        // Check if user is active
        if (!user.get('isActive')) {
            throw new errors_1.UnauthorizedError('Account is deactivated');
        }
        // Validate password
        const isValidPassword = await user.validatePassword(password);
        if (!isValidPassword) {
            throw new errors_1.UnauthorizedError('Invalid email or password');
        }
        // Generate JWT token
        const token = (0, jwt_utils_1.generateToken)(user);
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
    async changePassword(userId, currentPassword, newPassword) {
        const user = await user_model_1.default.findByPk(userId);
        if (!user) {
            throw new errors_1.ValidationError('User not found');
        }
        // Validate current password
        const isValidPassword = await user.validatePassword(currentPassword);
        if (!isValidPassword) {
            throw new errors_1.UnauthorizedError('Current password is incorrect');
        }
        // Hash and update new password
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
        await user.update({ password: hashedPassword });
    }
    /**
     * Reset user password (admin function)
     */
    async resetPassword(userId, newPassword) {
        const user = await user_model_1.default.findByPk(userId);
        if (!user) {
            throw new errors_1.ValidationError('User not found');
        }
        // Hash and update new password
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
        await user.update({ password: hashedPassword });
    }
    /**
     * Deactivate user account
     */
    async deactivateUser(userId) {
        const user = await user_model_1.default.findByPk(userId);
        if (!user) {
            throw new errors_1.ValidationError('User not found');
        }
        await user.update({ isActive: false });
    }
    /**
     * Activate user account
     */
    async activateUser(userId) {
        const user = await user_model_1.default.findByPk(userId);
        if (!user) {
            throw new errors_1.ValidationError('User not found');
        }
        await user.update({ isActive: true });
    }
}
exports.AuthService = AuthService;
exports.default = new AuthService();
