import { Op } from 'sequelize';
import { Module } from '../models/module.model';
import { Permission } from '../models/permission.model';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors';

export interface CreateModuleData {
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateModuleData {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface ModuleWithDetails {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  permissions: Array<{
    id: number;
    name: string;
    action: string;
    description?: string;
  }>;
  permissionCount: number;
}

export interface ModuleFilters {
  search?: string;
  isActive?: boolean;
  hasPermissions?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: string;
  order?: 'ASC' | 'DESC';
}

/**
 * Module Service
 * Handles module-related business logic and operations
 */
export class ModuleService {
  /**
   * Get all modules with optional filtering and pagination
   */
  async getModules(filters: ModuleFilters = {}): Promise<{ modules: ModuleWithDetails[]; total: number }> {
    const { search, isActive, hasPermissions, limit = 50, offset = 0, sortBy = 'createdAt', order = 'DESC' } = filters;

    // Build where conditions
    const whereConditions: any = {};

    if (search) {
      whereConditions[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    if (isActive !== undefined) {
      whereConditions.isActive = isActive;
    }

    // Build include conditions
    const includeConditions: any = [
      {
        model: Permission,
        as: 'permissions',
        required: hasPermissions === true,
      },
    ];

    // Execute query
    const { rows: modules, count: total } = await Module.findAndCountAll({
      where: whereConditions,
      include: includeConditions,
      limit,
      offset,
      distinct: true,
      order: [[sortBy, order]],
    });

    // Transform results
    const transformedModules: ModuleWithDetails[] = modules.map((module: any) => ({
      id: module.get('id'),
      name: module.get('name'),
      description: module.get('description'),
      isActive: module.get('isActive'),
      createdAt: module.get('createdAt'),
      updatedAt: module.get('updatedAt'),
      permissions: ((module.get('permissions') as any[]) || []).map((permission: any) => ({
        id: permission.get('id'),
        name: permission.get('name'),
        action: permission.get('action'),
        description: permission.get('description'),
      })),
      permissionCount: ((module.get('permissions') as any[]) || []).length,
    }));

    return { modules: transformedModules, total };
  }

  /**
   * Get module by ID with full details
   */
  async getModuleById(id: number): Promise<ModuleWithDetails> {
    const module = await Module.findByPk(id, {
      include: [
        {
          model: Permission,
          as: 'permissions',
        },
      ],
    });

    if (!module) {
      throw new NotFoundError('Module not found');
    }

    return {
      id: module.get('id'),
      name: module.get('name'),
      description: module.get('description'),
      isActive: module.get('isActive'),
      createdAt: module.get('createdAt'),
      updatedAt: module.get('updatedAt'),
      permissions: ((module.get('permissions') as any[]) || []).map((permission: any) => ({
        id: permission.get('id'),
        name: permission.get('name'),
        action: permission.get('action'),
        description: permission.get('description'),
      })),
      permissionCount: ((module.get('permissions') as any[]) || []).length,
    };
  }

  /**
   * Get module by name
   */
  async getModuleByName(name: string): Promise<ModuleWithDetails> {
    const module = await Module.findOne({
      where: { name },
      include: [
        {
          model: Permission,
          as: 'permissions',
        },
      ],
    });

    if (!module) {
      throw new NotFoundError('Module not found');
    }

    return {
      id: module.get('id'),
      name: module.get('name'),
      description: module.get('description'),
      isActive: module.get('isActive'),
      createdAt: module.get('createdAt'),
      updatedAt: module.get('updatedAt'),
      permissions: ((module.get('permissions') as any[]) || []).map((permission: any) => ({
        id: permission.get('id'),
        name: permission.get('name'),
        action: permission.get('action'),
        description: permission.get('description'),
      })),
      permissionCount: ((module.get('permissions') as any[]) || []).length,
    };
  }

  /**
   * Create a new module
   */
  async createModule(moduleData: CreateModuleData): Promise<ModuleWithDetails> {
    const { name, description, isActive = true } = moduleData;

    // Check for existing module with same name
    const existingModule = await Module.findOne({ where: { name } });
    if (existingModule) {
      throw new ConflictError('Module name already exists');
    }

    // Create module
    const module = await Module.create({
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
  async updateModule(id: number, updateData: UpdateModuleData): Promise<ModuleWithDetails> {
    const module = await Module.findByPk(id);
    if (!module) {
      throw new NotFoundError('Module not found');
    }

    // Check for name conflicts if updating name
    if (updateData.name && updateData.name !== module.get('name')) {
      const existingModule = await Module.findOne({
        where: { name: updateData.name, id: { [Op.ne]: id } },
      });
      if (existingModule) {
        throw new ConflictError('Module name already exists');
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
  async deleteModule(id: number): Promise<void> {
    const module = await Module.findByPk(id);
    if (!module) {
      throw new NotFoundError('Module not found');
    }

    // Check if module has permissions
    const permissionCount = await Permission.count({ where: { moduleId: id } });
    if (permissionCount > 0) {
      throw new ValidationError('Cannot delete module with existing permissions. Delete permissions first.');
    }

    // Soft delete by deactivating
    await module.update({ isActive: false });
  }

  /**
   * Hard delete module (permanently remove from database)
   */
  async hardDeleteModule(id: number): Promise<void> {
    const module = await Module.findByPk(id);
    if (!module) {
      throw new NotFoundError('Module not found');
    }

    // Check if module has permissions
    const permissionCount = await Permission.count({ where: { moduleId: id } });
    if (permissionCount > 0) {
      throw new ValidationError('Cannot delete module with existing permissions. Delete permissions first.');
    }

    // Hard delete module
    await module.destroy();
  }

  /**
   * Create standard CRUD permissions for a module
   */
  async createStandardPermissions(moduleId: number): Promise<{
    created: Array<{
      id: number;
      name: string;
      action: string;
      description?: string;
    }>;
  }> {
    const module = await Module.findByPk(moduleId);
    if (!module) {
      throw new NotFoundError('Module not found');
    }

    const moduleName = module.get('name');
    const standardActions: ('create' | 'read' | 'update' | 'delete')[] = ['create', 'read', 'update', 'delete'];

    // Check for existing permissions
    const existingPermissions = await Permission.findAll({
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

      const createdPermissions = await Permission.bulkCreate(permissionsToCreate, {
        returning: true,
      });

      newPermissions.push(...createdPermissions.map((permission: any) => ({
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
  async getModulesWithPermissionCounts(): Promise<Array<{
    id: number;
    name: string;
    description?: string;
    isActive: boolean;
    permissionCount: number;
    activePermissionCount: number;
  }>> {
    const modules = await Module.findAll({
      include: [
        {
          model: Permission,
          as: 'permissions',
          attributes: ['id', 'isActive'],
        },
      ],
      order: [['name', 'ASC']],
    });

    return modules.map((module: any) => {
      const permissions = module.permissions || [];
      return {
        id: module.get('id'),
        name: module.get('name'),
        description: module.get('description'),
        isActive: module.get('isActive'),
        permissionCount: permissions.length,
        activePermissionCount: permissions.filter((p: any) => p.get('isActive')).length,
      };
    });
  }

  /**
   * Get module statistics
   */
  async getModuleStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    withPermissions: number;
    withoutPermissions: number;
    averagePermissionsPerModule: number;
    totalPermissions: number;
  }> {
    const [total, active, withPermissions, totalPermissions] = await Promise.all([
      Module.count(),
      Module.count({ where: { isActive: true } }),
      Module.count({
        include: [
          {
            model: Permission,
            as: 'permissions',
            required: true,
          },
        ],
        distinct: true,
      }),
      Permission.count(),
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
  validateModuleName(name: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

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

export default new ModuleService();
