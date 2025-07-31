"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = __importDefault(require("../controllers/user.controller"));
const user_validator_1 = require("../validators/user.validator");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
const userController = new user_controller_1.default();
/**
 * @route   GET /api/users
 * @desc    Get all users with optional filtering
 * @access  Private (requires read permission on Users module)
 */
router.get('/', auth_middleware_1.requireAuth, (0, auth_middleware_1.checkPermission)('Users', 'read'), userController.getAll);
/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (requires read permission on Users module)
 */
router.get('/:id', auth_middleware_1.requireAuth, (0, auth_middleware_1.checkPermission)('Users', 'read'), user_validator_1.getUserValidation, userController.getById);
/**
 * @route   POST /api/users
 * @desc    Create a new user
 * @access  Private (requires create permission on Users module)
 */
router.post('/', auth_middleware_1.requireAuth, (0, auth_middleware_1.checkPermission)('Users', 'create'), user_validator_1.createUserValidation, userController.create);
/**
 * @route   PUT /api/users/:id
 * @desc    Update a user
 * @access  Private (requires update permission on Users module)
 */
router.put('/:id', auth_middleware_1.requireAuth, (0, auth_middleware_1.checkPermission)('Users', 'update'), user_validator_1.updateUserValidation, userController.update);
/**
 * @route   DELETE /api/users/:id
 * @desc    Delete a user
 * @access  Private (requires delete permission on Users module)
 */
router.delete('/:id', auth_middleware_1.requireAuth, (0, auth_middleware_1.checkPermission)('Users', 'delete'), user_validator_1.getUserValidation, userController.delete);
exports.default = router;
