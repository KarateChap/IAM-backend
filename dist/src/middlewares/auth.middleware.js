"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.checkPermission = exports.requireAuth = void 0;
const jwt_utils_1 = require("../utils/jwt.utils");
const user_model_1 = __importDefault(require("../models/user.model"));
const userPermission_controller_1 = __importDefault(require("../controllers/userPermission.controller"));
/**
 * Authentication middleware to protect routes
 * Verifies JWT token and attaches user to request object
 */
const requireAuth = async (req, res, next) => {
    try {
        // Get authorization header
        const authHeader = req.headers.authorization;
        // Extract token
        const token = (0, jwt_utils_1.extractTokenFromHeader)(authHeader);
        if (!token) {
            res.status(401).json({ message: 'Authentication required. No token provided.' });
            return;
        }
        // Verify token
        const decoded = (0, jwt_utils_1.verifyToken)(token);
        if (!decoded) {
            res.status(401).json({ message: 'Invalid or expired token.' });
            return;
        }
        // Find the user and attach to request
        const user = await user_model_1.default.findByPk(decoded.id);
        if (!user) {
            res.status(401).json({ message: 'User not found.' });
            return;
        }
        // Attach user and userId to request for further use
        req.user = user;
        req.userId = decoded.id;
        // Continue to the protected route
        next();
    }
    catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({ message: 'Server error during authentication.' });
    }
};
exports.requireAuth = requireAuth;
/**
 * Permission-based middleware factory
 * Creates middleware to check if user has specific permission
 */
const checkPermission = (module, action) => {
    const userPermissionController = new userPermission_controller_1.default();
    return userPermissionController.checkPermission(module, action);
};
exports.checkPermission = checkPermission;
/**
 * Optional authentication middleware
 * If token is present and valid, attaches user to request
 * Does not fail if token is missing or invalid
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = (0, jwt_utils_1.extractTokenFromHeader)(authHeader);
        if (token) {
            const decoded = (0, jwt_utils_1.verifyToken)(token);
            if (decoded) {
                req.userId = decoded.id;
            }
        }
        next();
    }
    catch (error) {
        // Just proceed without authentication
        next();
    }
};
exports.optionalAuth = optionalAuth;
