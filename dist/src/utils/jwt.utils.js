"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractTokenFromHeader = exports.verifyToken = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
/**
 * Generates a JWT token for a user
 * @param user User object
 * @returns JWT token
 */
const generateToken = (user) => {
    const payload = {
        id: user.id,
        username: user.username,
        email: user.email,
    };
    const jwtSecret = process.env.JWT_SECRET || 'fallback_jwt_secret';
    const expiresIn = (process.env.JWT_EXPIRES_IN || '24h');
    return jsonwebtoken_1.default.sign(payload, jwtSecret, { expiresIn });
};
exports.generateToken = generateToken;
/**
 * Verifies a JWT token
 * @param token JWT token
 * @returns Decoded token payload or null if invalid
 */
const verifyToken = (token) => {
    try {
        const jwtSecret = process.env.JWT_SECRET || 'fallback_jwt_secret';
        return jsonwebtoken_1.default.verify(token, jwtSecret);
    }
    catch {
        return null;
    }
};
exports.verifyToken = verifyToken;
/**
 * Extracts token from request headers
 * @param authHeader Authorization header value
 * @returns JWT token or null if not found
 */
const extractTokenFromHeader = (authHeader) => {
    if (!authHeader?.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.slice(7);
};
exports.extractTokenFromHeader = extractTokenFromHeader;
