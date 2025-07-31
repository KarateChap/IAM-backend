// Mock database and models first
jest.mock('../../../src/config/database', () => ({
  sequelize: {
    authenticate: jest.fn(),
    define: jest.fn(),
    models: {
      UserGroup: { count: jest.fn() },
      GroupRole: { count: jest.fn() },
      RolePermission: { count: jest.fn() },
    },
    query: jest.fn(),
  },
}));

// Mock all model files to avoid initialization issues
jest.mock('../../../src/models/user.model', () => ({
  default: {
    findAll: jest.fn(),
    count: jest.fn(),
  },
}));

jest.mock('../../../src/models/group.model', () => ({
  Group: {
    findAll: jest.fn(),
    count: jest.fn(),
  },
}));

jest.mock('../../../src/models/role.model', () => ({
  Role: {
    findAll: jest.fn(),
    count: jest.fn(),
  },
}));

jest.mock('../../../src/models/permission.model', () => ({
  Permission: {
    findAll: jest.fn(),
    count: jest.fn(),
  },
}));

jest.mock('../../../src/models/module.model', () => ({
  Module: {
    findAll: jest.fn(),
    count: jest.fn(),
  },
}));

import { AuditService, AuditLog, SystemHealth, PermissionAudit } from '../../../src/services/audit.service';
import { sequelize } from '../../../src/config/database';
import User from '../../../src/models/user.model';
import { Group } from '../../../src/models/group.model';
import { Role } from '../../../src/models/role.model';
import { Permission } from '../../../src/models/permission.model';
import { Module } from '../../../src/models/module.model';



const MockedUser = User as jest.Mocked<typeof User>;
const MockedGroup = Group as jest.Mocked<typeof Group>;
const MockedRole = Role as jest.Mocked<typeof Role>;
const MockedPermission = Permission as jest.Mocked<typeof Permission>;
const MockedModule = Module as jest.Mocked<typeof Module>;
const mockedSequelize = sequelize as jest.Mocked<typeof sequelize>;

describe('AuditService', () => {
  let auditService: AuditService;

  beforeEach(() => {
    auditService = new AuditService();
    jest.clearAllMocks();
    
    // Mock console.log to avoid test output noise
    jest.spyOn(console, 'log').mockImplementation();
    
    // Set up model mocks
    MockedUser.count = jest.fn();
    MockedUser.findAll = jest.fn();
    MockedGroup.count = jest.fn();
    MockedGroup.findAll = jest.fn();
    MockedRole.count = jest.fn();
    MockedRole.findAll = jest.fn();
    MockedPermission.count = jest.fn();
    MockedPermission.findAll = jest.fn();
    MockedModule.count = jest.fn();
    MockedModule.findAll = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('logEvent', () => {
    it('should log an audit event with timestamp', async () => {
      const event = {
        userId: 1,
        username: 'testuser',
        action: 'CREATE',
        resource: 'users',
        resourceId: 1,
        details: { name: 'Test User' },
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      };

      await auditService.logEvent(event);

      const logs = await auditService.getAuditLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject(event);
      expect(logs[0].timestamp).toBeInstanceOf(Date);
    });

    it('should maintain only last 1000 logs in memory', async () => {
      // Add 1001 logs (ACTION_0 to ACTION_1000)
      for (let i = 0; i < 1001; i++) {
        await auditService.logEvent({
          action: `ACTION_${i}`,
          resource: 'test',
          userId: i,
        });
      }

      const logs = await auditService.getAuditLogs();
      expect(logs).toHaveLength(1000);
      // Should keep the most recent 1000 logs
      // The most recent log should be ACTION_1000
      expect(logs.find(log => log.action === 'ACTION_1000')).toBeDefined();
      // ACTION_0 should be removed (oldest)
      expect(logs.find(log => log.action === 'ACTION_0')).toBeUndefined();
      // ACTION_1 should still exist (part of last 1000)
      expect(logs.find(log => log.action === 'ACTION_1')).toBeDefined();
    });

    it('should log to console in development', async () => {
      const consoleSpy = jest.spyOn(console, 'log');
      
      await auditService.logEvent({
        action: 'TEST_ACTION',
        resource: 'test',
        userId: 1,
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[AUDIT]')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('TEST_ACTION on test by user 1')
      );
    });
  });

  describe('getAuditLogs', () => {
    beforeEach(async () => {
      // Clear any existing logs
      await auditService.getAuditLogs(); // This will reset the internal state
      
      // Add test logs with specific timestamps
      const createEvent = {
        userId: 1,
        action: 'CREATE',
        resource: 'users',
      };
      
      const updateEvent = {
        userId: 2,
        action: 'UPDATE',
        resource: 'groups',
      };
      
      const deleteEvent = {
        userId: 1,
        action: 'DELETE',
        resource: 'users',
      };

      // Add them in chronological order
      await auditService.logEvent(createEvent);
      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 1));
      await auditService.logEvent(updateEvent);
      await new Promise(resolve => setTimeout(resolve, 1));
      await auditService.logEvent(deleteEvent);
    });

    it('should return all logs when no filters applied', async () => {
      const logs = await auditService.getAuditLogs();
      expect(logs).toHaveLength(3);
      // Check that all expected actions are present
      const actions = logs.map(log => log.action);
      expect(actions).toContain('CREATE');
      expect(actions).toContain('UPDATE');
      expect(actions).toContain('DELETE');
      // Should be sorted by timestamp descending (most recent first)
      expect(logs[0].timestamp >= logs[1].timestamp).toBe(true);
      expect(logs[1].timestamp >= logs[2].timestamp).toBe(true);
    });

    it('should filter logs by userId', async () => {
      const logs = await auditService.getAuditLogs({ userId: 1 });
      expect(logs).toHaveLength(2);
      expect(logs.every(log => log.userId === 1)).toBe(true);
    });

    it('should filter logs by action', async () => {
      const logs = await auditService.getAuditLogs({ action: 'CREATE' });
      expect(logs).toHaveLength(1);
      expect(logs[0].action).toBe('CREATE');
    });

    it('should filter logs by resource', async () => {
      const logs = await auditService.getAuditLogs({ resource: 'users' });
      expect(logs).toHaveLength(2);
      expect(logs.every(log => log.resource === 'users')).toBe(true);
    });

    it('should filter logs by date range', async () => {
      // Get current timestamp range for filtering
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 60000);
      const oneMinuteFromNow = new Date(now.getTime() + 60000);
      
      const logs = await auditService.getAuditLogs({
        startDate: oneMinuteAgo,
        endDate: oneMinuteFromNow,
      });
      expect(logs).toHaveLength(3); // All logs should be within this range
    });

    it('should apply limit to results', async () => {
      const logs = await auditService.getAuditLogs({ limit: 2 });
      expect(logs).toHaveLength(2);
      expect(logs[0].action).toBe('DELETE');
      expect(logs[1].action).toBe('UPDATE');
    });

    it('should combine multiple filters', async () => {
      const logs = await auditService.getAuditLogs({
        userId: 1,
        resource: 'users',
        limit: 1,
      });
      expect(logs).toHaveLength(1);
      expect(logs[0].action).toBe('DELETE');
    });
  });

  describe('getSystemHealth', () => {
    it('should return healthy status when database is accessible', async () => {
      (mockedSequelize.authenticate as jest.Mock).mockResolvedValue(undefined);
      MockedUser.count.mockResolvedValue(10);
      MockedGroup.count.mockResolvedValue(5);
      MockedRole.count.mockResolvedValue(3);
      MockedPermission.count.mockResolvedValue(20);
      MockedModule.count.mockResolvedValue(6);
      (mockedSequelize.models.UserGroup.count as jest.Mock).mockResolvedValue(15);
      (mockedSequelize.models.GroupRole.count as jest.Mock).mockResolvedValue(8);
      (mockedSequelize.models.RolePermission.count as jest.Mock).mockResolvedValue(25);

      const health = await auditService.getSystemHealth();

      expect(health.database.status).toBe('healthy');
      expect(health.database.connectionTime).toBeGreaterThanOrEqual(0);
      expect(health.models).toEqual({
        users: 10,
        groups: 5,
        roles: 3,
        permissions: 20,
        modules: 6,
      });
      expect(health.relationships).toEqual({
        userGroups: 15,
        groupRoles: 8,
        rolePermissions: 25,
      });
      expect(health.timestamp).toBeInstanceOf(Date);
    });

    it('should return error status when database is not accessible', async () => {
      const dbError = new Error('Connection failed');
      (mockedSequelize.authenticate as jest.Mock).mockRejectedValue(dbError);

      const health = await auditService.getSystemHealth();

      expect(health.database.status).toBe('error');
      expect(health.database.error).toBe('Connection failed');
      expect(health.models).toEqual({
        users: 0,
        groups: 0,
        roles: 0,
        permissions: 0,
        modules: 0,
      });
    });

    it('should handle unknown error types', async () => {
      (mockedSequelize.authenticate as jest.Mock).mockRejectedValue('string error');

      const health = await auditService.getSystemHealth();

      expect(health.database.status).toBe('error');
      expect(health.database.error).toBe('Unknown error');
    });
  });

  describe('performPermissionAudit', () => {
    it('should audit user permissions correctly', async () => {
      // Mock a simplified user structure that matches what the service expects
      const mockUsers = [
        {
          get: jest.fn((key: string) => {
            const userData: any = {
              id: 1,
              username: 'user1',
              email: 'user1@test.com',
              isActive: true,
              groups: [
                {
                  get: jest.fn((key: string) => {
                    const groupData: any = {
                      id: 1,
                      name: 'Admin Group',
                      roles: [
                        {
                          get: jest.fn((key: string) => {
                            const roleData: any = {
                              id: 1,
                              name: 'Admin Role',
                              permissions: [
                                { get: jest.fn(() => 'users:create') },
                                { get: jest.fn(() => 'users:read') },
                              ],
                            };
                            return roleData[key];
                          }),
                        },
                      ],
                    };
                    return groupData[key];
                  }),
                },
              ],
            };
            return userData[key];
          }),
        },
      ];

      MockedUser.findAll.mockResolvedValue(mockUsers as any);

      const auditResults = await auditService.performPermissionAudit();

      expect(auditResults).toHaveLength(1);
      expect(auditResults[0].userId).toBe(1);
      expect(auditResults[0].username).toBe('user1');
      expect(auditResults[0].email).toBe('user1@test.com');
      expect(auditResults[0].isActive).toBe(true);
      expect(Array.isArray(auditResults[0].effectivePermissions)).toBe(true);
      expect(typeof auditResults[0].permissionCount).toBe('number');

      expect(MockedUser.findAll).toHaveBeenCalledWith({
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
    });

    it('should handle users with no permissions', async () => {
      const mockUsers = [
        {
          get: jest.fn((key: string) => {
            const data: any = {
              id: 2,
              username: 'user2',
              email: 'user2@test.com',
              isActive: true,
              groups: [],
            };
            return data[key];
          }),
        },
      ];

      MockedUser.findAll.mockResolvedValue(mockUsers as any);

      const auditResults = await auditService.performPermissionAudit();

      expect(auditResults).toHaveLength(1);
      expect(auditResults[0]).toMatchObject({
        userId: 2,
        username: 'user2',
        email: 'user2@test.com',
        isActive: true,
        permissionCount: 0,
        effectivePermissions: [],
        groups: [],
      });
    });

    it('should log audit completion event', async () => {
      MockedUser.findAll.mockResolvedValue([]);

      await auditService.performPermissionAudit();

      const logs = await auditService.getAuditLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        action: 'PERMISSION_AUDIT_COMPLETED',
        resource: 'system',
        details: {
          userCount: 0,
          totalPermissions: 0,
        },
      });
    });
  });

  describe('getPermissionStatistics', () => {
    it('should calculate permission statistics correctly', async () => {
      // Mock performPermissionAudit to return test data
      const mockAuditResults: PermissionAudit[] = [
        {
          userId: 1,
          username: 'user1',
          email: 'user1@test.com',
          groups: [],
          effectivePermissions: ['users:create', 'users:read'],
          permissionCount: 2,
          isActive: true,
        },
        {
          userId: 2,
          username: 'user2',
          email: 'user2@test.com',
          groups: [],
          effectivePermissions: ['users:read'],
          permissionCount: 1,
          isActive: true,
        },
        {
          userId: 3,
          username: 'user3',
          email: 'user3@test.com',
          groups: [],
          effectivePermissions: [],
          permissionCount: 0,
          isActive: true,
        },
      ];

      jest.spyOn(auditService, 'performPermissionAudit').mockResolvedValue(mockAuditResults);

      const stats = await auditService.getPermissionStatistics();

      expect(stats).toEqual({
        totalUsers: 3,
        usersWithPermissions: 2,
        usersWithoutPermissions: 1,
        averagePermissionsPerUser: 1,
        mostCommonPermissions: [
          { permission: 'users:read', userCount: 2 },
          { permission: 'users:create', userCount: 1 },
        ],
        permissionDistribution: [
          { permissionCount: 0, userCount: 1 },
          { permissionCount: 1, userCount: 1 },
          { permissionCount: 2, userCount: 1 },
        ],
      });
    });

    it('should handle empty user list', async () => {
      jest.spyOn(auditService, 'performPermissionAudit').mockResolvedValue([]);

      const stats = await auditService.getPermissionStatistics();

      expect(stats).toEqual({
        totalUsers: 0,
        usersWithPermissions: 0,
        usersWithoutPermissions: 0,
        averagePermissionsPerUser: 0,
        mostCommonPermissions: [],
        permissionDistribution: [],
      });
    });
  });

  describe('checkOrphanedRecords', () => {
    it('should check for orphaned records correctly', async () => {
      (mockedSequelize.query as jest.Mock)
        .mockResolvedValueOnce([{ count: 2 } as any]) // orphaned UserGroups
        .mockResolvedValueOnce([{ count: 1 } as any]) // orphaned GroupRoles
        .mockResolvedValueOnce([{ count: 0 } as any]) // orphaned RolePermissions
        .mockResolvedValueOnce([{ count: 3 } as any]); // inactive users with groups

      const result = await auditService.checkOrphanedRecords();

      expect(result).toEqual({
        orphanedUserGroups: 2,
        orphanedGroupRoles: 1,
        orphanedRolePermissions: 0,
        inactiveUsersWithGroups: 3,
      });

      expect(mockedSequelize.query).toHaveBeenCalledTimes(4);
    });

    it('should handle null counts from database', async () => {
      (mockedSequelize.query as jest.Mock)
        .mockResolvedValueOnce([{ count: null } as any])
        .mockResolvedValueOnce([{ count: null } as any])
        .mockResolvedValueOnce([{ count: null } as any])
        .mockResolvedValueOnce([{ count: null } as any]);

      const result = await auditService.checkOrphanedRecords();

      expect(result).toEqual({
        orphanedUserGroups: 0,
        orphanedGroupRoles: 0,
        orphanedRolePermissions: 0,
        inactiveUsersWithGroups: 0,
      });
    });
  });

  describe('generateSystemReport', () => {
    it('should generate comprehensive system report', async () => {
      const mockHealth: SystemHealth = {
        database: { status: 'healthy', connectionTime: 10 },
        models: { users: 10, groups: 5, roles: 3, permissions: 20, modules: 6 },
        relationships: { userGroups: 15, groupRoles: 8, rolePermissions: 25 },
        timestamp: new Date(),
      };

      const mockPermissionStats = {
        totalUsers: 10,
        usersWithPermissions: 8,
        usersWithoutPermissions: 2,
        averagePermissionsPerUser: 5.5,
        mostCommonPermissions: [],
        permissionDistribution: [],
      };

      const mockOrphanedRecords = {
        orphanedUserGroups: 0,
        orphanedGroupRoles: 0,
        orphanedRolePermissions: 0,
        inactiveUsersWithGroups: 1,
      };

      jest.spyOn(auditService, 'getSystemHealth').mockResolvedValue(mockHealth);
      jest.spyOn(auditService, 'getPermissionStatistics').mockResolvedValue(mockPermissionStats);
      jest.spyOn(auditService, 'checkOrphanedRecords').mockResolvedValue(mockOrphanedRecords);

      const report = await auditService.generateSystemReport();

      expect(report).toEqual({
        health: mockHealth,
        permissionStats: mockPermissionStats,
        orphanedRecords: mockOrphanedRecords,
        recentActivity: [],
        generatedAt: expect.any(Date),
      });

      // Should log report generation
      const logs = await auditService.getAuditLogs();
      const reportLog = logs.find(log => log.action === 'SYSTEM_REPORT_GENERATED');
      expect(reportLog).toBeDefined();
      expect(reportLog?.details).toEqual({
        healthStatus: 'healthy',
        totalUsers: 10,
        orphanedRecords: 1,
      });
    });
  });
});
