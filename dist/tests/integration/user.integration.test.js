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
describe('User Integration Tests', () => {
    const setupTestData = async () => {
        // Create Users module
        const usersModule = await module_model_1.Module.create({
            name: 'Users',
            description: 'User management module',
            isActive: true
        });
        // Create permissions
        const createPermission = await permission_model_1.Permission.create({
            name: 'Users:create',
            action: 'create',
            moduleId: usersModule.get('id'),
            isActive: true
        });
        const readPermission = await permission_model_1.Permission.create({
            name: 'Users:read',
            action: 'read',
            moduleId: usersModule.get('id'),
            isActive: true
        });
        const updatePermission = await permission_model_1.Permission.create({
            name: 'Users:update',
            action: 'update',
            moduleId: usersModule.get('id'),
            isActive: true
        });
        const deletePermission = await permission_model_1.Permission.create({
            name: 'Users:delete',
            action: 'delete',
            moduleId: usersModule.get('id'),
            isActive: true
        });
        // Create role
        const adminRole = await role_model_1.Role.create({
            name: 'Super Admin',
            description: 'Full system access',
            isActive: true
        });
        // Assign permissions to role
        await rolePermission_model_1.RolePermission.bulkCreate([
            { roleId: adminRole.get('id'), permissionId: createPermission.get('id') },
            { roleId: adminRole.get('id'), permissionId: readPermission.get('id') },
            { roleId: adminRole.get('id'), permissionId: updatePermission.get('id') },
            { roleId: adminRole.get('id'), permissionId: deletePermission.get('id') }
        ]);
        // Create group
        const adminGroup = await group_model_1.Group.create({
            name: 'Administrators',
            description: 'System administrators',
            isActive: true
        });
        // Assign role to group
        await groupRole_model_1.GroupRole.create({
            groupId: adminGroup.get('id'),
            roleId: adminRole.get('id')
        });
        // Create admin user
        const adminUser = await user_model_1.User.create({
            username: 'admin',
            email: 'admin@example.com',
            password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // Admin123!
            firstName: 'Admin',
            lastName: 'User',
            isActive: true
        });
        adminUserId = adminUser.get('id');
        // Assign user to group
        await userGroup_model_1.UserGroup.create({
            userId: adminUserId,
            groupId: adminGroup.get('id')
        });
        // Create test user
        const testUser = await user_model_1.User.create({
            username: 'testuser',
            email: 'test@example.com',
            password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
            firstName: 'Test',
            lastName: 'User',
            isActive: true
        });
        testUserId = testUser.get('id');
    };
    let app;
    let authToken;
    let adminUserId;
    let testUserId;
    beforeAll(async () => {
        // Create Express app
        app = (0, app_1.createApp)();
        // Sync database
        await database_1.sequelize.sync({ force: true });
        // Setup test data
        await setupTestData();
        // Login to get auth token
        const loginResponse = await (0, supertest_1.default)(app)
            .post('/api/auth/login')
            .send({
            email: 'admin@example.com',
            password: 'Admin123!'
        });
        authToken = loginResponse.body.data.token;
    });
    afterAll(async () => {
        await database_1.sequelize.close();
    });
    describe('GET /api/users', () => {
        it('should return users list for authenticated admin', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.users).toBeInstanceOf(Array);
            expect(response.body.data.total).toBe(2);
            expect(response.body.data.users[0]).toHaveProperty('id');
            expect(response.body.data.users[0]).toHaveProperty('username');
            expect(response.body.data.users[0]).toHaveProperty('email');
            expect(response.body.data.users[0]).not.toHaveProperty('password');
        });
        it('should return 401 for unauthenticated request', async () => {
            const response = await (0, supertest_1.default)(app).get('/api/users').expect(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('token');
        });
        it('should support search filtering', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/users?search=admin')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.users).toBeInstanceOf(Array);
            expect(response.body.data.users.length).toBeGreaterThanOrEqual(1);
            // Should find admin user
            const adminUser = response.body.data.users.find((u) => u.username === 'admin');
            expect(adminUser).toBeDefined();
        });
    });
    describe('GET /api/users/:id', () => {
        it('should return user by id for authenticated admin', async () => {
            const response = await (0, supertest_1.default)(app)
                .get(`/api/users/${adminUserId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('id', adminUserId);
            expect(response.body.data).toHaveProperty('username', 'admin');
            expect(response.body.data).toHaveProperty('email', 'admin@example.com');
            expect(response.body.data).not.toHaveProperty('password');
        });
        it('should return 404 for non-existent user', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/users/999')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('not found');
        });
        it('should return 401 for unauthenticated request', async () => {
            const response = await (0, supertest_1.default)(app).get('/api/users/1').expect(401);
            expect(response.body.success).toBe(false);
        });
    });
    describe('POST /api/users', () => {
        it('should create new user for authenticated admin', async () => {
            const validUserData = {
                username: 'newuser',
                email: 'newuser@example.com',
                password: 'Password123!',
                firstName: 'New',
                lastName: 'User',
            };
            const response = await (0, supertest_1.default)(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${authToken}`)
                .send(validUserData)
                .expect(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data).toHaveProperty('username', validUserData.username);
            expect(response.body.data).toHaveProperty('email', validUserData.email);
            expect(response.body.data).not.toHaveProperty('password');
        });
        it('should return 401 for unauthenticated request', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/users')
                .send({ username: 'test', email: 'test@test.com', password: 'Test123!' })
                .expect(401);
            expect(response.body.success).toBe(false);
        });
    });
    describe('PUT /api/users/:id', () => {
        const updateData = {
            firstName: 'Updated',
            lastName: 'Name',
        };
        it('should update user for authenticated admin', async () => {
            const response = await (0, supertest_1.default)(app)
                .put('/api/users/2')
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('firstName', updateData.firstName);
            expect(response.body.data).toHaveProperty('lastName', updateData.lastName);
        });
        it('should return 404 for non-existent user', async () => {
            const response = await (0, supertest_1.default)(app)
                .put('/api/users/999')
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('not found');
        });
        it('should return 401 for unauthenticated request', async () => {
            const response = await (0, supertest_1.default)(app).put('/api/users/2').send(updateData).expect(401);
            expect(response.body.success).toBe(false);
        });
    });
    describe('DELETE /api/users/:id', () => {
        it('should delete user for authenticated admin', async () => {
            const response = await (0, supertest_1.default)(app)
                .delete('/api/users/2')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('deleted');
        });
        it('should return 404 for non-existent user', async () => {
            const response = await (0, supertest_1.default)(app)
                .delete('/api/users/999')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('not found');
        });
        it('should return 401 for unauthenticated request', async () => {
            const response = await (0, supertest_1.default)(app).delete('/api/users/2').expect(401);
            expect(response.body.success).toBe(false);
        });
    });
});
