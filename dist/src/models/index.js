"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolePermission = exports.GroupRole = exports.UserGroup = exports.Permission = exports.Module = exports.Role = exports.Group = exports.User = void 0;
exports.initModels = initModels;
// Import models without circular dependencies
const user_model_1 = __importDefault(require("./user.model"));
exports.User = user_model_1.default;
const group_model_1 = require("./group.model");
Object.defineProperty(exports, "Group", { enumerable: true, get: function () { return group_model_1.Group; } });
const role_model_1 = require("./role.model");
Object.defineProperty(exports, "Role", { enumerable: true, get: function () { return role_model_1.Role; } });
const module_model_1 = require("./module.model");
Object.defineProperty(exports, "Module", { enumerable: true, get: function () { return module_model_1.Module; } });
const permission_model_1 = require("./permission.model");
Object.defineProperty(exports, "Permission", { enumerable: true, get: function () { return permission_model_1.Permission; } });
const userGroup_model_1 = require("./userGroup.model");
Object.defineProperty(exports, "UserGroup", { enumerable: true, get: function () { return userGroup_model_1.UserGroup; } });
const groupRole_model_1 = require("./groupRole.model");
Object.defineProperty(exports, "GroupRole", { enumerable: true, get: function () { return groupRole_model_1.GroupRole; } });
const rolePermission_model_1 = require("./rolePermission.model");
Object.defineProperty(exports, "RolePermission", { enumerable: true, get: function () { return rolePermission_model_1.RolePermission; } });
// Initialize models function
function initModels() {
    console.log('🔧 Initializing model associations...');
    // Debug: Check if models are properly loaded
    console.log('User model:', !!user_model_1.default);
    console.log('Group model:', !!group_model_1.Group);
    console.log('UserGroup model:', !!userGroup_model_1.UserGroup);
    // Define model associations
    // User <-> Group (many-to-many)
    console.log('Setting up User <-> Group association...');
    user_model_1.default.belongsToMany(group_model_1.Group, {
        through: userGroup_model_1.UserGroup,
        as: 'groups',
        foreignKey: 'userId'
    });
    group_model_1.Group.belongsToMany(user_model_1.default, {
        through: userGroup_model_1.UserGroup,
        as: 'users',
        foreignKey: 'groupId'
    });
    console.log('✅ User <-> Group association set up');
    // Group <-> Role (many-to-many)
    group_model_1.Group.belongsToMany(role_model_1.Role, {
        through: groupRole_model_1.GroupRole,
        as: 'roles',
        foreignKey: 'groupId'
    });
    role_model_1.Role.belongsToMany(group_model_1.Group, {
        through: groupRole_model_1.GroupRole,
        as: 'groups',
        foreignKey: 'roleId'
    });
    // Role <-> Permission (many-to-many)
    role_model_1.Role.belongsToMany(permission_model_1.Permission, {
        through: rolePermission_model_1.RolePermission,
        as: 'permissions',
        foreignKey: 'roleId'
    });
    permission_model_1.Permission.belongsToMany(role_model_1.Role, {
        through: rolePermission_model_1.RolePermission,
        as: 'roles',
        foreignKey: 'permissionId'
    });
    // Permission belongs to Module
    permission_model_1.Permission.belongsTo(module_model_1.Module, { foreignKey: 'moduleId', as: 'module' });
    module_model_1.Module.hasMany(permission_model_1.Permission, { foreignKey: 'moduleId', as: 'permissions' });
    // Export models for use in controllers
    return true;
}
