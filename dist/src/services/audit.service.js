"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const user_model_1 = __importDefault(require("../models/user.model"));
const group_model_1 = require("../models/group.model");
const role_model_1 = require("../models/role.model");
const permission_model_1 = require("../models/permission.model");
const module_model_1 = require("../models/module.model");
/**
 * Audit Service
 * Handles system monitoring, logging, and audit-related operations
 */
class AuditService {
    auditLogs = []; // In-memory storage (use database in production)
    /**
     * Log an audit event
     */
    async logEvent(event) {
        const auditLog = {
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
    async getAuditLogs(filters = {}) {
        let filteredLogs = [...this.auditLogs];
        if (filters.userId) {
            filteredLogs = filteredLogs.filter(log => log.userId === filters.userId);
        }
        if (filters.action) {
            filteredLogs = filteredLogs.filter(log => log.action.includes(filters.action));
        }
        if (filters.resource) {
            filteredLogs = filteredLogs.filter(log => log.resource === filters.resource);
        }
        if (filters.startDate) {
            filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.startDate);
        }
        if (filters.endDate) {
            filteredLogs = filteredLogs.filter(log => log.timestamp <= filters.endDate);
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
    async getSystemHealth() {
        const health = {
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
            await database_1.sequelize.authenticate();
            health.database.connectionTime = Date.now() - startTime;
            // Get model counts
            const [userCount, groupCount, roleCount, permissionCount, moduleCount, userGroupCount, groupRoleCount, rolePermissionCount,] = await Promise.all([
                user_model_1.default.count(),
                group_model_1.Group.count(),
                role_model_1.Role.count(),
                permission_model_1.Permission.count(),
                module_model_1.Module.count(),
                database_1.sequelize.models.UserGroup.count(),
                database_1.sequelize.models.GroupRole.count(),
                database_1.sequelize.models.RolePermission.count(),
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
        }
        catch (error) {
            health.database.status = 'error';
            health.database.error = error instanceof Error ? error.message : 'Unknown error';
        }
        return health;
    }
    /**
     * Perform comprehensive permission audit for all users
     */
    async performPermissionAudit() {
        const users = await user_model_1.default.findAll({
            include: [
                {
                    model: group_model_1.Group,
                    as: 'groups',
                    through: { attributes: [] },
                    include: [
                        {
                            model: role_model_1.Role,
                            as: 'roles',
                            through: { attributes: [] },
                            include: [
                                {
                                    model: permission_model_1.Permission,
                                    as: 'permissions',
                                    through: { attributes: [] },
                                },
                            ],
                        },
                    ],
                },
            ],
        });
        const auditResults = users.map((user) => {
            const groups = (user.get('groups') || []).map((group) => ({
                id: group.get('id'),
                name: group.get('name'),
                roles: (group.get('roles') || []).map((role) => ({
                    id: role.get('id'),
                    name: role.get('name'),
                    permissions: (role.get('permissions') || []).map((perm) => perm.get('name')),
                })),
            }));
            // Collect all effective permissions
            const effectivePermissions = new Set();
            groups.forEach((group) => {
                (group.roles || []).forEach((role) => {
                    (role.permissions || []).forEach((permission) => {
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
    async getPermissionStatistics() {
        const auditResults = await this.performPermissionAudit();
        const totalUsers = auditResults.length;
        const usersWithPermissions = auditResults.filter(user => user.permissionCount > 0).length;
        const usersWithoutPermissions = totalUsers - usersWithPermissions;
        const totalPermissions = auditResults.reduce((sum, user) => sum + user.permissionCount, 0);
        const averagePermissionsPerUser = totalUsers > 0 ? totalPermissions / totalUsers : 0;
        // Count permission occurrences
        const permissionCounts = new Map();
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
        const distributionMap = new Map();
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
    async checkOrphanedRecords() {
        const [orphanedUserGroups, orphanedGroupRoles, orphanedRolePermissions, inactiveUsersWithGroups,] = await Promise.all([
            // UserGroups without valid users or groups
            database_1.sequelize.query(`
        SELECT COUNT(*) as count FROM UserGroups ug
        LEFT JOIN Users u ON ug.userId = u.id
        LEFT JOIN Groups g ON ug.groupId = g.id
        WHERE u.id IS NULL OR g.id IS NULL
      `, { type: sequelize_1.QueryTypes.SELECT }),
            // GroupRoles without valid groups or roles
            database_1.sequelize.query(`
        SELECT COUNT(*) as count FROM GroupRoles gr
        LEFT JOIN Groups g ON gr.groupId = g.id
        LEFT JOIN Roles r ON gr.roleId = r.id
        WHERE g.id IS NULL OR r.id IS NULL
      `, { type: sequelize_1.QueryTypes.SELECT }),
            // RolePermissions without valid roles or permissions
            database_1.sequelize.query(`
        SELECT COUNT(*) as count FROM RolePermissions rp
        LEFT JOIN Roles r ON rp.roleId = r.id
        LEFT JOIN Permissions p ON rp.permissionId = p.id
        WHERE r.id IS NULL OR p.id IS NULL
      `, { type: sequelize_1.QueryTypes.SELECT }),
            // Inactive users still in groups
            database_1.sequelize.query(`
        SELECT COUNT(DISTINCT u.id) as count FROM Users u
        JOIN UserGroups ug ON u.id = ug.userId
        WHERE u.isActive = false
      `, { type: sequelize_1.QueryTypes.SELECT }),
        ]);
        return {
            orphanedUserGroups: orphanedUserGroups[0].count || 0,
            orphanedGroupRoles: orphanedGroupRoles[0].count || 0,
            orphanedRolePermissions: orphanedRolePermissions[0].count || 0,
            inactiveUsersWithGroups: inactiveUsersWithGroups[0].count || 0,
        };
    }
    /**
     * Generate system report
     */
    async generateSystemReport() {
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
exports.AuditService = AuditService;
exports.default = new AuditService();
