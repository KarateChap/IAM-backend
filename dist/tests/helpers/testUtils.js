"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.testAsyncFunction = exports.createAuthenticatedRequest = exports.createMockValidationResult = exports.createMockModel = exports.generateTestToken = exports.createMockNext = exports.createMockResponse = exports.createMockRequest = void 0;
const jwt = __importStar(require("jsonwebtoken"));
// Mock Express Request object
const createMockRequest = (overrides = {}) => ({
    body: {},
    params: {},
    query: {},
    headers: {},
    user: undefined,
    ...overrides
});
exports.createMockRequest = createMockRequest;
// Mock Express Response object
const createMockResponse = () => {
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
        cookie: jest.fn().mockReturnThis(),
        clearCookie: jest.fn().mockReturnThis()
    };
    return res;
};
exports.createMockResponse = createMockResponse;
// Mock Next Function
const createMockNext = () => jest.fn();
exports.createMockNext = createMockNext;
// Generate test JWT token
const generateTestToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
};
exports.generateTestToken = generateTestToken;
// Mock Sequelize model methods
const createMockModel = (data = {}) => ({
    findAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    count: jest.fn(),
    ...data
});
exports.createMockModel = createMockModel;
// Mock validation result
const createMockValidationResult = (errors = []) => ({
    isEmpty: jest.fn().mockReturnValue(errors.length === 0),
    array: jest.fn().mockReturnValue(errors),
    formatWith: jest.fn().mockReturnValue({ array: () => errors }),
    mapped: jest.fn().mockReturnValue({}),
    throw: jest.fn()
});
exports.createMockValidationResult = createMockValidationResult;
// Helper to create authenticated request
const createAuthenticatedRequest = (user, overrides = {}) => ({
    ...(0, exports.createMockRequest)(overrides),
    user,
    headers: {
        authorization: `Bearer ${(0, exports.generateTestToken)(user)}`,
        ...overrides.headers
    }
});
exports.createAuthenticatedRequest = createAuthenticatedRequest;
// Helper to test async middleware/controllers
const testAsyncFunction = async (fn, req, res, next) => {
    try {
        await fn(req, res, next);
    }
    catch (error) {
        next(error);
    }
};
exports.testAsyncFunction = testAsyncFunction;
