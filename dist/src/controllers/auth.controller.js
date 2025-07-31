"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const express_validator_1 = require("express-validator");
const services_1 = require("../services");
const errors_1 = require("../utils/errors");
/**
 * Register a new user
 * @route POST /api/auth/register
 */
const register = async (req, res, next) => {
    try {
        // Check for validation errors
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            // Format validation errors
            const validationErrors = errors.array().reduce((acc, curr) => {
                // Handle different validation error types safely
                let field = 'unknown';
                if (typeof curr === 'object' && curr !== null && 'param' in curr) {
                    field = String(curr.param);
                }
                acc[field] = curr.msg;
                return acc;
            }, {});
            throw new errors_1.ValidationError('Validation error', validationErrors);
        }
        const { username, email, password, firstName, lastName } = req.body;
        // Use auth service to register user
        const result = await services_1.authService.registerUser({
            username,
            email,
            password,
            firstName,
            lastName,
        });
        // Log the registration event
        await services_1.auditService.logEvent({
            userId: result.user.id,
            action: 'USER_REGISTERED',
            resource: 'users',
            resourceId: result.user.id,
            details: { username, email },
        });
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: result.user,
                token: result.token,
            },
        });
    }
    catch (error) {
        next(error instanceof Error ? error : new errors_1.InternalServerError('Server error during registration'));
    }
};
exports.register = register;
/**
 * Authenticate user and generate JWT
 * @route POST /api/auth/login
 */
const login = async (req, res, next) => {
    try {
        // Check for validation errors
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            // Format validation errors
            const validationErrors = errors.array().reduce((acc, curr) => {
                // Handle different validation error types safely
                let field = 'unknown';
                if (typeof curr === 'object' && curr !== null && 'param' in curr) {
                    field = String(curr.param);
                }
                acc[field] = curr.msg;
                return acc;
            }, {});
            throw new errors_1.ValidationError('Validation error', validationErrors);
        }
        const { email, password } = req.body;
        // Use auth service to login user
        const result = await services_1.authService.loginUser({ email, password });
        // Log the login event
        await services_1.auditService.logEvent({
            userId: result.user.id,
            action: 'USER_LOGIN',
            resource: 'auth',
            details: { email },
        });
        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: result.user,
                token: result.token,
            },
        });
    }
    catch (error) {
        next(error instanceof Error ? error : new errors_1.InternalServerError('Server error during login'));
    }
};
exports.login = login;
