import { QueryTypes } from 'sequelize';
import { sequelize } from '../config/database';
import User from '../models/user.model';
import { Group } from '../models/group.model';
import { Role } from '../models/role.model';
import { Permission } from '../models/permission.model';
import { Module } from '../models/module.model';

export interface AuditLog {
  timestamp: Date;
  userId?: number;
  username?: string;
  action: string;
  resource: string;
  resourceId?: number;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}

export interface SystemHealth {
  database: {
    status: 'healthy' | 'error';
    connectionTime?: number;
    error?: string;
  };
  models: {
    users: number;
    groups: number;
    roles: number;
    permissions: number;
    modules: number;
  };
  relationships: {
    userGroups: number;
    groupRoles: number;
    rolePermissions: number;
  };
  timestamp: Date;
}

export interface PermissionAudit {
  userId: number;
  username: string;
  email: string;
  groups: Array<{
    id: number;
    name: string;
    roles: Array<{
      id: number;
      name: string;
      permissions: string[];
    }>;
  }>;
  effectivePermissions: string[];
  permissionCount: number;
  lastLogin?: Date;
  isActive: boolean;
}

/**
 * Audit Service
 * Handles system monitoring, logging, and audit-related operations
 */
export class AuditService {
  private auditLogs: AuditLog[] = []; // In-memory storage (use database in production)

  /**
   * Log an audit event
   */
  async logEvent(event: Omit<AuditLog, 'timestamp'>): Promise<void> {
    const auditLog: AuditLog = {
      ...event,
      timestamp: new Date(),
    };

    // Store in memory (in production, save to database)
    this.auditLogs.push(auditLog);

    // Keep only last 1000 logs in memory
    if (this.auditLogs.length > 1000) {
      this.auditLogs = this.auditLogs.slice(-1000);
    }

    // Log to console for development
    console.log(`[AUDIT] ${auditLog.timestamp.toISOString()} - ${auditLog.action} on ${auditLog.resource} by user ${auditLog.userId || 'system'}`);
  }

  /**
   * Get audit logs with filtering
   */
  async getAuditLogs(filters: {
    userId?: number;
    action?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  } = {}): Promise<AuditLog[]> {
    let filteredLogs = [...this.auditLogs];

    if (filters.userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === filters.userId);
    }

    if (filters.action) {
      filteredLogs = filteredLogs.filter(log => log.action.includes(filters.action!));
    }

    if (filters.resource) {
      filteredLogs = filteredLogs.filter(log => log.resource === filters.resource);
    }

    if (filters.startDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.startDate!);
    }

    if (filters.endDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= filters.endDate!);
    }

    // Sort by timestamp descending
    filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply limit
    if (filters.limit) {
      filteredLogs = filteredLogs.slice(0, filters.limit);
    }

    return filteredLogs;
  }

  /**
   * Get system health status
   */
  async getSystemHealth(): Promise<SystemHealth> {
    const health: SystemHealth = {
      database: { status: 'healthy' },
      models: {
        users: 0,
        groups: 0,
        roles: 0,
        permissions: 0,
        modules: 0,
      },
      relationships: {
        userGroups: 0,
        groupRoles: 0,
        rolePermissions: 0,
      },
      timestamp: new Date(),
    };

    try {
      // Test database connection
      const startTime = Date.now();
      await sequelize.authenticate();
      health.database.connectionTime = Date.now() - startTime;

      // Get model counts
      const [
        userCount,
        groupCount,
        roleCount,
        permissionCount,
        moduleCount,
        userGroupCount,
        groupRoleCount,
        rolePermissionCount,
      ] = await Promise.all([
        User.count(),
        Group.count(),
        Role.count(),
        Permission.count(),
        Module.count(),
        sequelize.models.UserGroup.count(),
        sequelize.models.GroupRole.count(),
        sequelize.models.RolePermission.count(),
      ]);

      health.models = {
        users: userCount,
        groups: groupCount,
        roles: roleCount,
        permissions: permissionCount,
        modules: moduleCount,
      };

      health.relationships = {
        userGroups: userGroupCount,
        groupRoles: groupRoleCount,
        rolePermissions: rolePermissionCount,
      };
    } catch (error) {
      health.database.status = 'error';
      health.database.error = error instanceof Error ? error.message : 'Unknown error';
    }

    return health;
  }

  /**
   * Perform comprehensive permission audit for all users
   */
  async performPermissionAudit(): Promise<PermissionAudit[]> {
    const users = await User.findAll({
      include: [
        {
          model: Group,
          as: 'groups',
          through: { attributes: [] },
          include: [
            {
              model: Role,
              as: 'roles',
              through: { attributes: [] },
              include: [
                {
                  model: Permission,
                  as: 'permissions',
                  through: { attributes: [] },
                },
              ],
            },
          ],
        },
      ],
    });

    const auditResults: PermissionAudit[] = users.map((user: any) => {
      const groups = ((user.get('groups') as any[]) || []).map((group: any) => ({
        id: group.get('id'),
        name: group.get('name'),
        roles: ((group.get('roles') as any[]) || []).map((role: any) => ({
          id: role.get('id'),
          name: role.get('name'),
          permissions: ((role.get('permissions') as any[]) || []).map((perm: any) => perm.get('name')),
        })),
      }));

      // Collect all effective permissions
      const effectivePermissions = new Set<string>();
      groups.forEach((group: any) => {
        (group.roles || []).forEach((role: any) => {
          (role.permissions || []).forEach((permission: any) => {
            effectivePermissions.add(permission);
          });
        });
      });

      return {
        userId: user.get('id'),
        username: user.get('username'),
        email: user.get('email'),
        groups,
        effectivePermissions: Array.from(effectivePermissions).sort(),
        permissionCount: effectivePermissions.size,
        isActive: user.get('isActive'),
      };
    });

    // Log audit completion
    await this.logEvent({
      action: 'PERMISSION_AUDIT_COMPLETED',
      resource: 'system',
      details: {
        userCount: auditResults.length,
        totalPermissions: auditResults.reduce((sum, user) => sum + user.permissionCount, 0),
      },
    });

    return auditResults;
  }

  /**
   * Get permission distribution statistics
   */
  async getPermissionStatistics(): Promise<{
    totalUsers: number;
    usersWithPermissions: number;
    usersWithoutPermissions: number;
    averagePermissionsPerUser: number;
    mostCommonPermissions: Array<{ permission: string; userCount: number }>;
    permissionDistribution: Array<{ permissionCount: number; userCount: number }>;
  }> {
    const auditResults = await this.performPermissionAudit();

    const totalUsers = auditResults.length;
    const usersWithPermissions = auditResults.filter(user => user.permissionCount > 0).length;
    const usersWithoutPermissions = totalUsers - usersWithPermissions;

    const totalPermissions = auditResults.reduce((sum, user) => sum + user.permissionCount, 0);
    const averagePermissionsPerUser = totalUsers > 0 ? totalPermissions / totalUsers : 0;

    // Count permission occurrences
    const permissionCounts = new Map<string, number>();
    auditResults.forEach(user => {
      user.effectivePermissions.forEach(permission => {
        permissionCounts.set(permission, (permissionCounts.get(permission) || 0) + 1);
      });
    });

    // Get most common permissions
    const mostCommonPermissions = Array.from(permissionCounts.entries())
      .map(([permission, userCount]) => ({ permission, userCount }))
      .sort((a, b) => b.userCount - a.userCount)
      .slice(0, 10);

    // Get permission count distribution
    const distributionMap = new Map<number, number>();
    auditResults.forEach(user => {
      const count = user.permissionCount;
      distributionMap.set(count, (distributionMap.get(count) || 0) + 1);
    });

    const permissionDistribution = Array.from(distributionMap.entries())
      .map(([permissionCount, userCount]) => ({ permissionCount, userCount }))
      .sort((a, b) => a.permissionCount - b.permissionCount);

    return {
      totalUsers,
      usersWithPermissions,
      usersWithoutPermissions,
      averagePermissionsPerUser: Math.round(averagePermissionsPerUser * 100) / 100,
      mostCommonPermissions,
      permissionDistribution,
    };
  }

  /**
   * Check for orphaned records
   */
  async checkOrphanedRecords(): Promise<{
    orphanedUserGroups: number;
    orphanedGroupRoles: number;
    orphanedRolePermissions: number;
    inactiveUsersWithGroups: number;
  }> {
    const [
      orphanedUserGroups,
      orphanedGroupRoles,
      orphanedRolePermissions,
      inactiveUsersWithGroups,
    ] = await Promise.all([
      // UserGroups without valid users or groups
      sequelize.query(`
        SELECT COUNT(*) as count FROM UserGroups ug
        LEFT JOIN Users u ON ug.userId = u.id
        LEFT JOIN Groups g ON ug.groupId = g.id
        WHERE u.id IS NULL OR g.id IS NULL
      `, { type: QueryTypes.SELECT }),

      // GroupRoles without valid groups or roles
      sequelize.query(`
        SELECT COUNT(*) as count FROM GroupRoles gr
        LEFT JOIN Groups g ON gr.groupId = g.id
        LEFT JOIN Roles r ON gr.roleId = r.id
        WHERE g.id IS NULL OR r.id IS NULL
      `, { type: QueryTypes.SELECT }),

      // RolePermissions without valid roles or permissions
      sequelize.query(`
        SELECT COUNT(*) as count FROM RolePermissions rp
        LEFT JOIN Roles r ON rp.roleId = r.id
        LEFT JOIN Permissions p ON rp.permissionId = p.id
        WHERE r.id IS NULL OR p.id IS NULL
      `, { type: QueryTypes.SELECT }),

      // Inactive users still in groups
      sequelize.query(`
        SELECT COUNT(DISTINCT u.id) as count FROM Users u
        JOIN UserGroups ug ON u.id = ug.userId
        WHERE u.isActive = false
      `, { type: QueryTypes.SELECT }),
    ]);

    return {
      orphanedUserGroups: (orphanedUserGroups[0] as any).count || 0,
      orphanedGroupRoles: (orphanedGroupRoles[0] as any).count || 0,
      orphanedRolePermissions: (orphanedRolePermissions[0] as any).count || 0,
      inactiveUsersWithGroups: (inactiveUsersWithGroups[0] as any).count || 0,
    };
  }

  /**
   * Generate system report
   */
  async generateSystemReport(): Promise<{
    health: SystemHealth;
    permissionStats: Awaited<ReturnType<AuditService['getPermissionStatistics']>>;
    orphanedRecords: Awaited<ReturnType<AuditService['checkOrphanedRecords']>>;
    recentActivity: AuditLog[];
    generatedAt: Date;
  }> {
    const [health, permissionStats, orphanedRecords, recentActivity] = await Promise.all([
      this.getSystemHealth(),
      this.getPermissionStatistics(),
      this.checkOrphanedRecords(),
      this.getAuditLogs({ limit: 50 }),
    ]);

    await this.logEvent({
      action: 'SYSTEM_REPORT_GENERATED',
      resource: 'system',
      details: {
        healthStatus: health.database.status,
        totalUsers: permissionStats.totalUsers,
        orphanedRecords: Object.values(orphanedRecords).reduce((sum, count) => sum + count, 0),
      },
    });

    return {
      health,
      permissionStats,
      orphanedRecords,
      recentActivity,
      generatedAt: new Date(),
    };
  }
}

export default new AuditService();
