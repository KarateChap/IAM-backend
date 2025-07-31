// Mock data for testing
export const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  password: 'hashedPassword123',
  firstName: 'Test',
  lastName: 'User',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  get: function(key: string) {
    return (this as any)[key];
  },
  update: jest.fn(),
  destroy: jest.fn(),
  save: jest.fn(),
  reload: jest.fn()
};

export const mockGroup = {
  id: 1,
  name: 'Test Group',
  description: 'A test group',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  get: function(key: string) {
    return (this as any)[key];
  },
  update: jest.fn(),
  destroy: jest.fn(),
  addUser: jest.fn(),
  addRole: jest.fn(),
  save: jest.fn(),
  reload: jest.fn()
};

export const mockRole = {
  id: 1,
  name: 'Test Role',
  description: 'A test role',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  get: function(key: string) {
    return (this as any)[key];
  }
};

export const mockModule = {
  id: 1,
  name: 'Users',
  description: 'User management module',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  get: function(key: string) {
    return (this as any)[key];
  }
};

export const mockPermission = {
  id: 1,
  moduleId: 1,
  action: 'create',
  description: 'Create users',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  get: function(key: string) {
    return (this as any)[key];
  }
};

export const mockJwtPayload = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com'
};

export const mockValidationErrors = [
  {
    type: 'field',
    msg: 'Email is required',
    path: 'email',
    location: 'body'
  }
];

export const createMockSequelizeModel = (data: any) => ({
  ...data,
  get: jest.fn((key: string) => data[key]),
  set: jest.fn(),
  save: jest.fn().mockResolvedValue(data),
  destroy: jest.fn().mockResolvedValue(true),
  update: jest.fn().mockResolvedValue([1, [data]]),
  reload: jest.fn().mockResolvedValue(data)
});
