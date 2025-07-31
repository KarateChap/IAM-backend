"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = require("../../src/app");
const database_1 = require("../../src/config/database");
const user_model_1 = require("../../src/models/user.model");
const group_model_1 = require("../../src/models/group.model");
const role_model_1 = require("../../src/models/role.model");
const permission_model_1 = require("../../src/models/permission.model");
const module_model_1 = require("../../src/models/module.model");
const rolePermission_model_1 = require("../../src/models/rolePermission.model");
const groupRole_model_1 = require("../../src/models/groupRole.model");
const userGroup_model_1 = require("../../src/models/userGroup.model");
describe('Group Integration Tests', () => {
    let app;
    let authToken;
    let adminUserId;
    let testGroupId;
    const setupTestData = async () => {
        try {
            console.log('Starting setupTestData with permissions...');
            // Register user via API to ensure proper password hashing
            console.log('Registering user via API...');
            const registerResponse = await (0, supertest_1.default)(app)
                .post('/api/auth/register')
                .send({
                username: 'testadmin',
                email: 'testadmin@example.com',
                password: 'password',
                firstName: 'Test Admin',
                lastName: 'User'
            });
            console.log('Register response status:', registerResponse.status);
            if (registerResponse.status !== 201) {
                throw new Error(`Registration failed: ${JSON.stringify(registerResponse.body)}`);
            }
            // Get the created user
            const foundUser = await user_model_1.User.findOne({ where: { email: 'testadmin@example.com' } });
            if (foundUser) {
                adminUserId = foundUser.get('id');
                console.log('Found registered user with ID:', adminUserId);
            }
            else {
                throw new Error('User not found after registration');
            }
            // Create Groups module
            const groupsModule = await module_model_1.Module.create({
                id: 5001,
                name: 'Groups',
                description: 'Group management module',
                isActive: true
            });
            console.log('Created Groups module:', groupsModule.get('id'));
            // Create permissions for Groups module
            const permissions = await Promise.all([
                permission_model_1.Permission.create({
                    id: 6001,
                    name: 'Groups Read',
                    action: 'read',
                    moduleId: 5001,
                    description: 'Read groups',
                    isActive: true
                }),
                permission_model_1.Permission.create({
                    id: 6002,
                    name: 'Groups Create',
                    action: 'create',
                    moduleId: 5001,
                    description: 'Create groups',
                    isActive: true
                }),
                permission_model_1.Permission.create({
                    id: 6003,
                    name: 'Groups Update',
                    action: 'update',
                    moduleId: 5001,
                    description: 'Update groups',
                    isActive: true
                }),
                permission_model_1.Permission.create({
                    id: 6004,
                    name: 'Groups Delete',
                    action: 'delete',
                    moduleId: 5001,
                    description: 'Delete groups',
                    isActive: true
                })
            ]);
            console.log('Created permissions:', permissions.map(p => p.get('id')));
            // Create admin role
            const adminRole = await role_model_1.Role.create({
                id: 7001,
                name: 'Test Admin',
                description: 'Test admin role',
                isActive: true
            });
            console.log('Created admin role:', adminRole.get('id'));
            // Assign permissions to role
            await Promise.all(permissions.map(permission => rolePermission_model_1.RolePermission.create({
                roleId: 7001,
                permissionId: permission.get('id')
            })));
            console.log('Assigned permissions to role');
            // Create admin group
            const adminGroup = await group_model_1.Group.create({
                id: 8001,
                name: 'Test Admins',
                description: 'Test admin group',
                isActive: true
            });
            console.log('Created admin group:', adminGroup.get('id'));
            // Assign role to group
            await groupRole_model_1.GroupRole.create({
                groupId: 8001,
                roleId: 7001
            });
            console.log('Assigned role to group');
            // Assign user to group
            await userGroup_model_1.UserGroup.create({
                userId: adminUserId,
                groupId: 8001
            });
            console.log('Assigned user to group');
            console.log('Setup completed successfully!');
        }
        catch (error) {
            console.error('Error in setupTestData:', error);
            throw error;
        }
    };
    beforeAll(async () => {
        // Set test environment
        process.env.NODE_ENV = 'test';
        // Create Express app
        app = await (0, app_1.createApp)();
        // Initialize database with model associations (this won't auto-seed in test mode)
        await (0, database_1.initDatabase)();
        // Manually sync database for tests
        await database_1.sequelize.sync({ force: true });
        console.log('Test database synced successfully.');
        // Setup test data
        await setupTestData();
        // Login as admin to get auth token
        const loginResponse = await (0, supertest_1.default)(app)
            .post('/api/auth/login')
            .send({
            email: 'testadmin@example.com',
            password: 'password'
        });
        console.log('Login response status:', loginResponse.status);
        if (loginResponse.status === 200 && loginResponse.body.success) {
            authToken = loginResponse.body.data.token;
            // Debug: Check user permissions after login
            console.log('\n=== DEBUGGING USER PERMISSIONS ===');
            const permissionsResponse = await (0, supertest_1.default)(app)
                .get('/api/me/permissions')
                .set('Authorization', `Bearer ${authToken}`);
            console.log('Permissions response status:', permissionsResponse.status);
            console.log('Permissions response body:', JSON.stringify(permissionsResponse.body, null, 2));
            console.log('=== END DEBUGGING ===\n');
        }
        else {
            throw new Error(`Login failed. Response: ${JSON.stringify(loginResponse.body)}`);
        }
    });
    afterAll(async () => {
        await database_1.sequelize.close();
    });
    describe('GET /api/groups', () => {
        it('should return groups list for authenticated admin', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/groups')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.groups).toBeInstanceOf(Array);
            expect(response.body.data.total).toBeGreaterThan(0);
            expect(response.body.data.groups[0]).toHaveProperty('id');
            expect(response.body.data.groups[0]).toHaveProperty('name');
            expect(response.body.data.groups[0]).toHaveProperty('description');
        });
        it('should return 401 for unauthenticated request', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/groups')
                .expect(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('token');
        });
        it('should support search filtering', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/groups?search=admin')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.groups).toBeInstanceOf(Array);
            expect(response.body.data.groups.length).toBeGreaterThan(0);
        });
        it('should support isActive filtering', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/groups?isActive=true')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.groups).toBeInstanceOf(Array);
            expect(response.body.data.groups.every((group) => group.isActive)).toBe(true);
        });
        it('should support pagination', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/groups?page=1&limit=5')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.groups).toBeInstanceOf(Array);
            expect(response.body.data.groups.length).toBeLessThanOrEqual(5);
        });
    });
    describe('GET /api/groups/:id', () => {
        it('should return group by id for authenticated admin', async () => {
            // Get the admin group ID first
            const groupsResponse = await (0, supertest_1.default)(app)
                .get('/api/groups')
                .set('Authorization', `Bearer ${authToken}`);
            const adminGroup = groupsResponse.body.data.groups.find((g) => g.name === 'Administrators');
            const response = await (0, supertest_1.default)(app)
                .get(`/api/groups/${adminGroup.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('id', adminGroup.id);
            expect(response.body.data).toHaveProperty('name', 'Administrators');
            expect(response.body.data).toHaveProperty('description');
        });
        it('should return 404 for non-existent group', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/groups/99999')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('not found');
        });
        it('should return 401 for unauthenticated request', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/groups/1')
                .expect(401);
            expect(response.body.success).toBe(false);
        });
    });
    describe('POST /api/groups', () => {
        const validGroupData = {
            name: 'Test Group',
            description: 'A test group for integration testing',
            isActive: true
        };
        it('should create new group for authenticated admin', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/groups')
                .set('Authorization', `Bearer ${authToken}`)
                .send(validGroupData)
                .expect(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data).toHaveProperty('name', validGroupData.name);
            expect(response.body.data).toHaveProperty('description', validGroupData.description);
            expect(response.body.data).toHaveProperty('isActive', validGroupData.isActive);
            testGroupId = response.body.data.id;
        });
        it('should return 422 for invalid group data', async () => {
            const invalidData = {
                name: '', // empty name
                description: 'Test description'
            };
            const response = await (0, supertest_1.default)(app)
                .post('/api/groups')
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidData)
                .expect(422);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Validation failed');
            expect(response.body.errors).toBeDefined();
        });
        it('should return 409 for duplicate group name', async () => {
            const duplicateData = {
                name: 'Administrators', // duplicate name
                description: 'Another admin group'
            };
            const response = await (0, supertest_1.default)(app)
                .post('/api/groups')
                .set('Authorization', `Bearer ${authToken}`)
                .send(duplicateData)
                .expect(409);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('already exists');
        });
        it('should return 401 for unauthenticated request', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/groups')
                .send(validGroupData)
                .expect(401);
            expect(response.body.success).toBe(false);
        });
    });
    describe('PUT /api/groups/:id', () => {
        const updateData = {
            name: 'Updated Test Group',
            description: 'Updated description'
        };
        it('should update group for authenticated admin', async () => {
            const response = await (0, supertest_1.default)(app)
                .put(`/api/groups/${testGroupId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('name', updateData.name);
            expect(response.body.data).toHaveProperty('description', updateData.description);
        });
        it('should return 404 for non-existent group', async () => {
            const response = await (0, supertest_1.default)(app)
                .put('/api/groups/99999')
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('not found');
        });
        it('should return 422 for invalid update data', async () => {
            const invalidData = {
                name: '' // empty name
            };
            const response = await (0, supertest_1.default)(app)
                .put(`/api/groups/${testGroupId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidData)
                .expect(422);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Validation failed');
        });
        it('should return 401 for unauthenticated request', async () => {
            const response = await (0, supertest_1.default)(app)
                .put(`/api/groups/${testGroupId}`)
                .send(updateData)
                .expect(401);
            expect(response.body.success).toBe(false);
        });
    });
    describe('DELETE /api/groups/:id', () => {
        it('should delete group for authenticated admin', async () => {
            const response = await (0, supertest_1.default)(app)
                .delete(`/api/groups/${testGroupId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('deleted');
        });
        it('should return 404 for non-existent group', async () => {
            const response = await (0, supertest_1.default)(app)
                .delete('/api/groups/99999')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('not found');
        });
        it('should return 401 for unauthenticated request', async () => {
            const response = await (0, supertest_1.default)(app)
                .delete(`/api/groups/${testGroupId}`)
                .expect(401);
            expect(response.body.success).toBe(false);
        });
    });
    describe('GET /api/groups/statistics', () => {
        it('should return group statistics for authenticated admin', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/groups/statistics')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('totalGroups');
            expect(response.body.data).toHaveProperty('activeGroups');
            expect(response.body.data).toHaveProperty('inactiveGroups');
            expect(typeof response.body.data.totalGroups).toBe('number');
            expect(typeof response.body.data.activeGroups).toBe('number');
            expect(typeof response.body.data.inactiveGroups).toBe('number');
        });
        it('should return 401 for unauthenticated request', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/groups/statistics')
                .expect(401);
            expect(response.body.success).toBe(false);
        });
    });
    describe('Permission-based Access Control', () => {
        it('should deny access for user without proper permissions', async () => {
            // Create a user without permissions
            const limitedUser = await user_model_1.User.create({
                username: 'limited',
                email: 'limited@example.com',
                password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
                firstName: 'Limited',
                lastName: 'User',
                isActive: true
            });
            // Login as limited user
            const loginResponse = await (0, supertest_1.default)(app)
                .post('/api/auth/login')
                .send({
                email: 'limited@example.com',
                password: 'password'
            });
            const limitedToken = loginResponse.body.data.token;
            // Try to access groups endpoint
            const response = await (0, supertest_1.default)(app)
                .get('/api/groups')
                .set('Authorization', `Bearer ${limitedToken}`)
                .expect(403);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('permission');
        });
    });
});
