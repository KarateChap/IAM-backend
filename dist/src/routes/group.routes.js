"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const group_controller_1 = __importDefault(require("../controllers/group.controller"));
const group_validator_1 = require("../validators/group.validator");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
const groupController = new group_controller_1.default();
/**
 * @route   GET /api/groups
 * @desc    Get all groups with optional filtering
 * @access  Private (requires read permission on Groups module)
 */
router.get('/', auth_middleware_1.requireAuth, (0, auth_middleware_1.checkPermission)('Groups', 'read'), groupController.getAll);
/**
 * @route   GET /api/groups/:id
 * @desc    Get group by ID
 * @access  Private (requires read permission on Groups module)
 */
router.get('/:id', auth_middleware_1.requireAuth, (0, auth_middleware_1.checkPermission)('Groups', 'read'), group_validator_1.getGroupValidation, groupController.getById);
/**
 * @route   POST /api/groups
 * @desc    Create a new group
 * @access  Private (requires create permission on Groups module)
 */
router.post('/', auth_middleware_1.requireAuth, (0, auth_middleware_1.checkPermission)('Groups', 'create'), group_validator_1.createGroupValidation, groupController.create);
/**
 * @route   PUT /api/groups/:id
 * @desc    Update a group
 * @access  Private (requires update permission on Groups module)
 */
router.put('/:id', auth_middleware_1.requireAuth, (0, auth_middleware_1.checkPermission)('Groups', 'update'), group_validator_1.updateGroupValidation, groupController.update);
/**
 * @route   DELETE /api/groups/:id
 * @desc    Delete a group
 * @access  Private (requires delete permission on Groups module)
 */
router.delete('/:id', auth_middleware_1.requireAuth, (0, auth_middleware_1.checkPermission)('Groups', 'delete'), group_validator_1.getGroupValidation, groupController.delete);
exports.default = router;
