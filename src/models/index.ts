import { sequelize } from '../config/database';
// Import models without circular dependencies
import User from './user.model';
import { Group } from './group.model';
import { Role } from './role.model';
import { Module } from './module.model';
import { Permission } from './permission.model';
import { UserGroup } from './userGroup.model';
import { GroupRole } from './groupRole.model';
import { RolePermission } from './rolePermission.model';

// Initialize models function
export function initModels() {
  console.log('🔧 Initializing model associations...');
  
  // Debug: Check if models are properly loaded
  console.log('User model:', !!User);
  console.log('Group model:', !!Group);
  console.log('UserGroup model:', !!UserGroup);
  
  // Define model associations
  // User <-> Group (many-to-many)
  console.log('Setting up User <-> Group association...');
  User.belongsToMany(Group, {
    through: UserGroup,
    as: 'groups',
    foreignKey: 'userId'
  });
  Group.belongsToMany(User, {
    through: UserGroup,
    as: 'users',
    foreignKey: 'groupId'
  });
  console.log('✅ User <-> Group association set up');

  // Group <-> Role (many-to-many)
  Group.belongsToMany(Role, {
    through: GroupRole,
    as: 'roles',
    foreignKey: 'groupId'
  });
  Role.belongsToMany(Group, {
    through: GroupRole,
    as: 'groups',
    foreignKey: 'roleId'
  });

  // Role <-> Permission (many-to-many)
  Role.belongsToMany(Permission, {
    through: RolePermission,
    as: 'permissions',
    foreignKey: 'roleId'
  });
  Permission.belongsToMany(Role, {
    through: RolePermission,
    as: 'roles',
    foreignKey: 'permissionId'
  });

  // Permission belongs to Module
  Permission.belongsTo(Module, { foreignKey: 'moduleId', as: 'module' });
  Module.hasMany(Permission, { foreignKey: 'moduleId', as: 'permissions' });

  // Export models for use in controllers
  return true;
}

// Export all models for use in controllers
export {
  User,
  Group,
  Role,
  Module,
  Permission,
  UserGroup,
  GroupRole,
  RolePermission
};
