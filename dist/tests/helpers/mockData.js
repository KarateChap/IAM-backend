"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMockSequelizeModel = exports.mockValidationErrors = exports.mockJwtPayload = exports.mockPermission = exports.mockModule = exports.mockRole = exports.mockGroup = exports.mockUser = void 0;
// Mock data for testing
exports.mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashedPassword123',
    firstName: 'Test',
    lastName: 'User',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    get: function (key) {
        return this[key];
    },
    update: jest.fn(),
    destroy: jest.fn(),
    save: jest.fn(),
    reload: jest.fn()
};
exports.mockGroup = {
    id: 1,
    name: 'Test Group',
    description: 'A test group',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    get: function (key) {
        return this[key];
    },
    update: jest.fn(),
    destroy: jest.fn(),
    addUser: jest.fn(),
    addRole: jest.fn(),
    save: jest.fn(),
    reload: jest.fn()
};
exports.mockRole = {
    id: 1,
    name: 'Test Role',
    description: 'A test role',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    get: function (key) {
        return this[key];
    }
};
exports.mockModule = {
    id: 1,
    name: 'Users',
    description: 'User management module',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    get: function (key) {
        return this[key];
    }
};
exports.mockPermission = {
    id: 1,
    moduleId: 1,
    action: 'create',
    description: 'Create users',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    get: function (key) {
        return this[key];
    }
};
exports.mockJwtPayload = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com'
};
exports.mockValidationErrors = [
    {
        type: 'field',
        msg: 'Email is required',
        path: 'email',
        location: 'body'
    }
];
const createMockSequelizeModel = (data) => ({
    ...data,
    get: jest.fn((key) => data[key]),
    set: jest.fn(),
    save: jest.fn().mockResolvedValue(data),
    destroy: jest.fn().mockResolvedValue(true),
    update: jest.fn().mockResolvedValue([1, [data]]),
    reload: jest.fn().mockResolvedValue(data)
});
exports.createMockSequelizeModel = createMockSequelizeModel;
