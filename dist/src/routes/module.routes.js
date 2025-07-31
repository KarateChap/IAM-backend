"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const module_controller_1 = __importDefault(require("../controllers/module.controller"));
const module_validator_1 = require("../validators/module.validator");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
const moduleController = new module_controller_1.default();
/**
 * @route   GET /api/modules
 * @desc    Get all modules with optional filtering
 * @access  Private
 */
router.get('/', auth_middleware_1.requireAuth, (0, auth_middleware_1.checkPermission)('Modules', 'read'), moduleController.getAll);
/**
 * @route   GET /api/modules/:id
 * @desc    Get module by ID
 * @access  Private
 */
router.get('/:id', auth_middleware_1.requireAuth, (0, auth_middleware_1.checkPermission)('Modules', 'read'), module_validator_1.getModuleValidation, moduleController.getById);
/**
 * @route   POST /api/modules
 * @desc    Create a new module
 * @access  Private
 */
router.post('/', auth_middleware_1.requireAuth, (0, auth_middleware_1.checkPermission)('Modules', 'create'), module_validator_1.createModuleValidation, moduleController.create);
/**
 * @route   PUT /api/modules/:id
 * @desc    Update a module
 * @access  Private
 */
router.put('/:id', auth_middleware_1.requireAuth, (0, auth_middleware_1.checkPermission)('Modules', 'update'), module_validator_1.updateModuleValidation, moduleController.update);
/**
 * @route   DELETE /api/modules/:id
 * @desc    Delete a module
 * @access  Private
 */
router.delete('/:id', auth_middleware_1.requireAuth, (0, auth_middleware_1.checkPermission)('Modules', 'delete'), module_validator_1.getModuleValidation, moduleController.delete);
exports.default = router;
