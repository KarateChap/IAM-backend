"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_validator_1 = require("express-validator");
const auth_validator_1 = require("../../../src/validators/auth.validator");
const testUtils_1 = require("../../helpers/testUtils");
// Helper function to run validation
const runValidation = async (validations, req) => {
    for (const validation of validations) {
        await validation.run(req);
    }
    return (0, express_validator_1.validationResult)(req);
};
describe('Auth Validators', () => {
    describe('registerValidation', () => {
        it('should pass with valid registration data', async () => {
            // Arrange
            const req = (0, testUtils_1.createMockRequest)({
                body: {
                    username: 'testuser',
                    email: 'test@example.com',
                    password: 'password123',
                    firstName: 'Test',
                    lastName: 'User'
                }
            });
            // Act
            const result = await runValidation(auth_validator_1.registerValidation, req);
            // Assert
            expect(result.isEmpty()).toBe(true);
        });
        it('should fail with short username', async () => {
            // Arrange
            const req = (0, testUtils_1.createMockRequest)({
                body: {
                    username: 'ab', // Too short
                    email: 'test@example.com',
                    password: 'password123'
                }
            });
            // Act
            const result = await runValidation(auth_validator_1.registerValidation, req);
            // Assert
            expect(result.isEmpty()).toBe(false);
            const errors = result.array();
            expect(errors).toHaveLength(1);
            expect(errors[0].msg).toBe('Username must be between 3 and 50 characters');
        });
        it('should fail with long username', async () => {
            // Arrange
            const req = (0, testUtils_1.createMockRequest)({
                body: {
                    username: 'a'.repeat(51), // Too long
                    email: 'test@example.com',
                    password: 'password123'
                }
            });
            // Act
            const result = await runValidation(auth_validator_1.registerValidation, req);
            // Assert
            expect(result.isEmpty()).toBe(false);
            const errors = result.array();
            expect(errors[0].msg).toBe('Username must be between 3 and 50 characters');
        });
        it('should fail with invalid email', async () => {
            // Arrange
            const req = (0, testUtils_1.createMockRequest)({
                body: {
                    username: 'testuser',
                    email: 'invalid-email',
                    password: 'password123'
                }
            });
            // Act
            const result = await runValidation(auth_validator_1.registerValidation, req);
            // Assert
            expect(result.isEmpty()).toBe(false);
            const errors = result.array();
            expect(errors[0].msg).toBe('Must be a valid email address');
        });
        it('should fail with short password', async () => {
            // Arrange
            const req = (0, testUtils_1.createMockRequest)({
                body: {
                    username: 'testuser',
                    email: 'test@example.com',
                    password: '123' // Too short
                }
            });
            // Act
            const result = await runValidation(auth_validator_1.registerValidation, req);
            // Assert
            expect(result.isEmpty()).toBe(false);
            const errors = result.array();
            expect(errors[0].msg).toBe('Password must be at least 6 characters long');
        });
        it('should pass with optional fields missing', async () => {
            // Arrange
            const req = (0, testUtils_1.createMockRequest)({
                body: {
                    username: 'testuser',
                    email: 'test@example.com',
                    password: 'password123'
                    // firstName and lastName are optional
                }
            });
            // Act
            const result = await runValidation(auth_validator_1.registerValidation, req);
            // Assert
            expect(result.isEmpty()).toBe(true);
        });
        it('should fail with invalid firstName', async () => {
            // Arrange
            const req = (0, testUtils_1.createMockRequest)({
                body: {
                    username: 'testuser',
                    email: 'test@example.com',
                    password: 'password123',
                    firstName: '', // Empty string
                    lastName: 'User'
                }
            });
            // Act
            const result = await runValidation(auth_validator_1.registerValidation, req);
            // Assert
            expect(result.isEmpty()).toBe(false);
            const errors = result.array();
            expect(errors[0].msg).toBe('First name must be between 1 and 50 characters');
        });
        it('should fail with multiple validation errors', async () => {
            // Arrange
            const req = (0, testUtils_1.createMockRequest)({
                body: {
                    username: 'ab', // Too short
                    email: 'invalid-email', // Invalid format
                    password: '123' // Too short
                }
            });
            // Act
            const result = await runValidation(auth_validator_1.registerValidation, req);
            // Assert
            expect(result.isEmpty()).toBe(false);
            const errors = result.array();
            expect(errors.length).toBeGreaterThan(1);
        });
    });
    describe('loginValidation', () => {
        it('should pass with valid login data', async () => {
            // Arrange
            const req = (0, testUtils_1.createMockRequest)({
                body: {
                    email: 'test@example.com',
                    password: 'password123'
                }
            });
            // Act
            const result = await runValidation(auth_validator_1.loginValidation, req);
            // Assert
            expect(result.isEmpty()).toBe(true);
        });
        it('should fail with invalid email', async () => {
            // Arrange
            const req = (0, testUtils_1.createMockRequest)({
                body: {
                    email: 'invalid-email',
                    password: 'password123'
                }
            });
            // Act
            const result = await runValidation(auth_validator_1.loginValidation, req);
            // Assert
            expect(result.isEmpty()).toBe(false);
            const errors = result.array();
            expect(errors[0].msg).toBe('Must be a valid email address');
        });
        it('should fail with missing password', async () => {
            // Arrange
            const req = (0, testUtils_1.createMockRequest)({
                body: {
                    email: 'test@example.com'
                    // Missing password
                }
            });
            // Act
            const result = await runValidation(auth_validator_1.loginValidation, req);
            // Assert
            expect(result.isEmpty()).toBe(false);
            const errors = result.array();
            expect(errors[0].msg).toBe('Password is required');
        });
        it('should fail with missing email', async () => {
            // Arrange
            const req = (0, testUtils_1.createMockRequest)({
                body: {
                    password: 'password123'
                    // Missing email
                }
            });
            // Act
            const result = await runValidation(auth_validator_1.loginValidation, req);
            // Assert
            expect(result.isEmpty()).toBe(false);
            const errors = result.array();
            expect(errors[0].msg).toBe('Must be a valid email address');
        });
        it('should normalize email addresses', async () => {
            // Arrange
            const req = (0, testUtils_1.createMockRequest)({
                body: {
                    email: 'Test@Example.COM',
                    password: 'password123'
                }
            });
            // Act
            const result = await runValidation(auth_validator_1.loginValidation, req);
            // Assert
            expect(result.isEmpty()).toBe(true);
            expect(req.body.email).toBe('test@example.com');
        });
    });
});
