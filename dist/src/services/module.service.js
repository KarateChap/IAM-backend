"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModuleService = void 0;
const sequelize_1 = require("sequelize");
const module_model_1 = require("../models/module.model");
const permission_model_1 = require("../models/permission.model");
const errors_1 = require("../utils/errors");
/**
 * Module Service
 * Handles module-related business logic and operations
 */
class ModuleService {
    /**
     * Get all modules with optional filtering and pagination
     */
    async getModules(filters = {}) {
        const { search, isActive, hasPermissions, limit = 50, offset = 0, sortBy = 'createdAt', order = 'DESC' } = filters;
        // Build where conditions
        const whereConditions = {};
        if (search) {
            whereConditions[sequelize_1.Op.or] = [
                { name: { [sequelize_1.Op.like]: `%${search}%` } },
                { description: { [sequelize_1.Op.like]: `%${search}%` } },
            ];
        }
        if (isActive !== undefined) {
            whereConditions.isActive = isActive;
        }
        // Build include conditions
        const includeConditions = [
            {
                model: permission_model_1.Permission,
                as: 'permissions',
                required: hasPermissions === true,
            },
        ];
        // Execute query
        const { rows: modules, count: total } = await module_model_1.Module.findAndCountAll({
            where: whereConditions,
            include: includeConditions,
            limit,
            offset,
            distinct: true,
            order: [[sortBy, order]],
        });
        // Transform results
        const transformedModules = modules.map((module) => ({
            id: module.get('id'),
            name: module.get('name'),
            description: module.get('description'),
            isActive: module.get('isActive'),
            createdAt: module.get('createdAt'),
            updatedAt: module.get('updatedAt'),
            permissions: (module.get('permissions') || []).map((permission) => ({
                id: permission.get('id'),
                name: permission.get('name'),
                action: permission.get('action'),
                description: permission.get('description'),
            })),
            permissionCount: (module.get('permissions') || []).length,
        }));
        return { modules: transformedModules, total };
    }
    /**
     * Get module by ID with full details
     */
    async getModuleById(id) {
        const module = await module_model_1.Module.findByPk(id, {
            include: [
                {
                    model: permission_model_1.Permission,
                    as: 'permissions',
                },
            ],
        });
        if (!module) {
            throw new errors_1.NotFoundError('Module not found');
        }
        return {
            id: module.get('id'),
            name: module.get('name'),
            description: module.get('description'),
            isActive: module.get('isActive'),
            createdAt: module.get('createdAt'),
            updatedAt: module.get('updatedAt'),
            permissions: (module.get('permissions') || []).map((permission) => ({
                id: permission.get('id'),
                name: permission.get('name'),
                action: permission.get('action'),
                description: permission.get('description'),
            })),
            permissionCount: (module.get('permissions') || []).length,
        };
    }
    /**
     * Get module by name
     */
    async getModuleByName(name) {
        const module = await module_model_1.Module.findOne({
            where: { name },
            include: [
                {
                    model: permission_model_1.Permission,
                    as: 'permissions',
                },
            ],
        });
        if (!module) {
            throw new errors_1.NotFoundError('Module not found');
        }
        return {
            id: module.get('id'),
            name: module.get('name'),
            description: module.get('description'),
            isActive: module.get('isActive'),
            createdAt: module.get('createdAt'),
            updatedAt: module.get('updatedAt'),
            permissions: (module.get('permissions') || []).map((permission) => ({
                id: permission.get('id'),
                name: permission.get('name'),
                action: permission.get('action'),
                description: permission.get('description'),
            })),
            permissionCount: (module.get('permissions') || []).length,
        };
    }
    /**
     * Create a new module
     */
    async createModule(moduleData) {
        const { name, description, isActive = true } = moduleData;
        // Check for existing module with same name
        const existingModule = await module_model_1.Module.findOne({ where: { name } });
        if (existingModule) {
            throw new errors_1.ConflictError('Module name already exists');
        }
        // Create module
        const module = await module_model_1.Module.create({
            name,
            description,
            isActive,
        });
        // Return module with empty permissions
        return {
            id: module.id,
            name: module.name,
            description: module.description,
            isActive: module.isActive,
            createdAt: module.createdAt,
            updatedAt: module.updatedAt,
            permissions: [],
            permissionCount: 0,
        };
    }
    /**
     * Update module
     */
    async updateModule(id, updateData) {
        const module = await module_model_1.Module.findByPk(id);
        if (!module) {
            throw new errors_1.NotFoundError('Module not found');
        }
        // Check for name conflicts if updating name
        if (updateData.name && updateData.name !== module.get('name')) {
            const existingModule = await module_model_1.Module.findOne({
                where: { name: updateData.name, id: { [sequelize_1.Op.ne]: id } },
            });
            if (existingModule) {
                throw new errors_1.ConflictError('Module name already exists');
            }
        }
        // Update module
        await module.update(updateData);
        // Return updated module with details
        return this.getModuleById(id);
    }
    /**
     * Delete module (soft delete by setting isActive to false)
     */
    async deleteModule(id) {
        const module = await module_model_1.Module.findByPk(id);
        if (!module) {
            throw new errors_1.NotFoundError('Module not found');
        }
        // Check if module has permissions
        const permissionCount = await permission_model_1.Permission.count({ where: { moduleId: id } });
        if (permissionCount > 0) {
            throw new errors_1.ValidationError('Cannot delete module with existing permissions. Delete permissions first.');
        }
        // Soft delete by deactivating
        await module.update({ isActive: false });
    }
    /**
     * Hard delete module (permanently remove from database)
     */
    async hardDeleteModule(id) {
        const module = await module_model_1.Module.findByPk(id);
        if (!module) {
            throw new errors_1.NotFoundError('Module not found');
        }
        // Check if module has permissions
        const permissionCount = await permission_model_1.Permission.count({ where: { moduleId: id } });
        if (permissionCount > 0) {
            throw new errors_1.ValidationError('Cannot delete module with existing permissions. Delete permissions first.');
        }
        // Hard delete module
        await module.destroy();
    }
    /**
     * Create standard CRUD permissions for a module
     */
    async createStandardPermissions(moduleId) {
        const module = await module_model_1.Module.findByPk(moduleId);
        if (!module) {
            throw new errors_1.NotFoundError('Module not found');
        }
        const moduleName = module.get('name');
        const standardActions = ['create', 'read', 'update', 'delete'];
        // Check for existing permissions
        const existingPermissions = await permission_model_1.Permission.findAll({
            where: { moduleId, action: standardActions },
        });
        const existingActions = existingPermissions.map(p => p.get('action'));
        const newActions = standardActions.filter(action => !existingActions.includes(action));
        // Create new permissions
        const newPermissions = [];
        if (newActions.length > 0) {
            const permissionsToCreate = newActions.map(action => ({
                name: `${moduleName} ${action.charAt(0).toUpperCase() + action.slice(1)}`,
                action,
                description: `${action.charAt(0).toUpperCase() + action.slice(1)} ${moduleName.toLowerCase()}`,
                moduleId,
                isActive: true,
            }));
            const createdPermissions = await permission_model_1.Permission.bulkCreate(permissionsToCreate, {
                returning: true,
            });
            newPermissions.push(...createdPermissions.map((permission) => ({
                id: permission.get('id'),
                name: permission.get('name'),
                action: permission.get('action'),
                description: permission.get('description'),
            })));
        }
        return { created: newPermissions };
    }
    /**
     * Get modules with permission counts
     */
    async getModulesWithPermissionCounts() {
        const modules = await module_model_1.Module.findAll({
            include: [
                {
                    model: permission_model_1.Permission,
                    as: 'permissions',
                    attributes: ['id', 'isActive'],
                },
            ],
            order: [['name', 'ASC']],
        });
        return modules.map((module) => {
            const permissions = module.permissions || [];
            return {
                id: module.get('id'),
                name: module.get('name'),
                description: module.get('description'),
                isActive: module.get('isActive'),
                permissionCount: permissions.length,
                activePermissionCount: permissions.filter((p) => p.get('isActive')).length,
            };
        });
    }
    /**
     * Get module statistics
     */
    async getModuleStatistics() {
        const [total, active, withPermissions, totalPermissions] = await Promise.all([
            module_model_1.Module.count(),
            module_model_1.Module.count({ where: { isActive: true } }),
            module_model_1.Module.count({
                include: [
                    {
                        model: permission_model_1.Permission,
                        as: 'permissions',
                        required: true,
                    },
                ],
                distinct: true,
            }),
            permission_model_1.Permission.count(),
        ]);
        return {
            total,
            active,
            inactive: total - active,
            withPermissions,
            withoutPermissions: total - withPermissions,
            averagePermissionsPerModule: total > 0 ? Math.round((totalPermissions / total) * 100) / 100 : 0,
            totalPermissions,
        };
    }
    /**
     * Validate module name format
     */
    validateModuleName(name) {
        const errors = [];
        // Check length
        if (name.length < 2) {
            errors.push('Module name must be at least 2 characters long');
        }
        if (name.length > 50) {
            errors.push('Module name must not exceed 50 characters');
        }
        // Check format (alphanumeric, spaces, hyphens, underscores)
        const validNamePattern = /^[a-zA-Z0-9\s\-_]+$/;
        if (!validNamePattern.test(name)) {
            errors.push('Module name can only contain letters, numbers, spaces, hyphens, and underscores');
        }
        // Check if starts with letter
        if (!/^[a-zA-Z]/.test(name)) {
            errors.push('Module name must start with a letter');
        }
        return {
            isValid: errors.length === 0,
            errors,
        };
    }
}
exports.ModuleService = ModuleService;
exports.default = new ModuleService();
