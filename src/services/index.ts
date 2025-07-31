/**
 * Services Index
 * Central export point for all service modules
 */

export { AuthService, default as authService } from './auth.service';
export { PermissionService, default as permissionService } from './permission.service';
export { UserService, default as userService } from './user.service';
export { AuditService, default as auditService } from './audit.service';
export { GroupService, default as groupService } from './group.service';
export { RoleService, default as roleService } from './role.service';
export { ModuleService, default as moduleService } from './module.service';

// Export types for external use
export type {
  RegisterUserData,
  LoginCredentials,
  AuthResult,
} from './auth.service';

export type {
  PermissionCheck,
  UserPermissionSummary,
} from './permission.service';

export type {
  CreateUserData,
  UpdateUserData,
  UserWithGroups,
  UserFilters,
} from './user.service';

export type {
  AuditLog,
  SystemHealth,
  PermissionAudit,
} from './audit.service';

export type {
  CreateGroupData,
  UpdateGroupData,
  GroupWithDetails,
  GroupFilters,
} from './group.service';

export type {
  CreateRoleData,
  UpdateRoleData,
  RoleWithDetails,
  RoleFilters,
} from './role.service';

export type {
  CreateModuleData,
  UpdateModuleData,
  ModuleWithDetails,
  ModuleFilters,
} from './module.service';
