"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDatabase = exports.sequelize = void 0;
const sequelize_1 = require("sequelize");
// Initialize SQLite in-memory database for development/testing
const sequelize = new sequelize_1.Sequelize({
    dialect: 'sqlite',
    storage: ':memory:', // Using in-memory SQLite database as required
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
        timestamps: true, // Adds createdAt and updatedAt to models
        // underscored: true, // Commented out to avoid column name conflicts
    },
});
exports.sequelize = sequelize;
// Function to initialize database connection and sync models
const initDatabase = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connection has been established successfully.');
        // Set NODE_ENV to development if not defined (for testing purposes)
        if (!process.env.NODE_ENV) {
            process.env.NODE_ENV = 'development';
        }
        // Import models only after sequelize instance is exported
        console.log('📦 Loading models and setting up associations...');
        const { initModels } = await Promise.resolve().then(() => __importStar(require('../models/index')));
        console.log('📦 initModels function loaded:', typeof initModels);
        initModels();
        console.log('✅ Model associations initialized');
        // Sync models with database (in development only)
        if (process.env.NODE_ENV === 'development') {
            // Force true will drop tables and recreate them (use with caution)
            await sequelize.sync({ force: true });
            console.log('All models were synchronized successfully.');
            // Auto-seed the database with initial data
            await autoSeedDatabase();
            console.log('Database seeded successfully.');
        }
    }
    catch (error) {
        console.error('Unable to connect to the database:', error);
        throw error;
    }
};
exports.initDatabase = initDatabase;
/**
 * Auto-seed the database with initial data
 * This runs automatically on server startup in development mode
 */
const autoSeedDatabase = async () => {
    try {
        // Import models dynamically to avoid circular dependencies
        const User = (await Promise.resolve().then(() => __importStar(require('../models/user.model')))).default;
        const { Group } = await Promise.resolve().then(() => __importStar(require('../models/group.model')));
        const { Role } = await Promise.resolve().then(() => __importStar(require('../models/role.model')));
        const { Module } = await Promise.resolve().then(() => __importStar(require('../models/module.model')));
        const { Permission } = await Promise.resolve().then(() => __importStar(require('../models/permission.model')));
        const { UserGroup } = await Promise.resolve().then(() => __importStar(require('../models/userGroup.model')));
        const { GroupRole } = await Promise.resolve().then(() => __importStar(require('../models/groupRole.model')));
        const { RolePermission } = await Promise.resolve().then(() => __importStar(require('../models/rolePermission.model')));
        console.log('🌱 Auto-seeding database...');
        // Create modules using bulkCreate to ensure IDs are properly set
        console.log('Creating modules...');
        const moduleData = [
            { name: 'Users', description: 'User management module', isActive: true },
            { name: 'Groups', description: 'Group management module', isActive: true },
            { name: 'Roles', description: 'Role management module', isActive: true },
            { name: 'Modules', description: 'Module management module', isActive: true },
            { name: 'Permissions', description: 'Permission management module', isActive: true },
            { name: 'Assignments', description: 'Assignment management module', isActive: true }
        ];
        const modules = await Module.bulkCreate(moduleData, { returning: true });
        console.log('Modules created:', modules.map(m => ({ id: m.id, name: m.name })));
        // Create comprehensive permissions for all modules
        const permissions = [];
        const actions = ['create', 'read', 'update', 'delete'];
        for (const module of modules) {
            // Access properties safely to avoid Sequelize shadowing issues
            const moduleName = module.get('name');
            const moduleId = module.get('id');
            console.log(`Creating permissions for module: ${moduleName} (ID: ${moduleId})`);
            for (const action of actions) {
                const permission = await Permission.create({
                    name: `${moduleName}.${action}`,
                    description: `${action.charAt(0).toUpperCase() + action.slice(1)} ${moduleName}`,
                    action: action,
                    moduleId: moduleId,
                    isActive: true,
                });
                console.log(`Created permission: ${permission.get('name')}`);
                permissions.push(permission);
            }
        }
        // Create admin role
        const adminRole = await Role.create({
            name: 'Super Admin',
            description: 'Full system access',
            isActive: true,
        });
        // Assign ALL permissions to admin role
        for (const permission of permissions) {
            await RolePermission.create({
                roleId: adminRole.id,
                permissionId: permission.id,
            });
        }
        // Create admin group
        const adminGroup = await Group.create({
            name: 'Administrators',
            description: 'System administrators with full access',
            isActive: true,
        });
        // Assign role to group
        await GroupRole.create({
            groupId: adminGroup.id,
            roleId: adminRole.id,
        });
        // Create default admin user
        const adminUser = await User.create({
            username: 'admin',
            email: 'admin@example.com',
            password: 'Admin123!',
            firstName: 'Admin',
            lastName: 'User',
            isActive: true,
        });
        // Assign admin user to admin group
        await UserGroup.create({
            userId: adminUser.id,
            groupId: adminGroup.id,
        });
        console.log('✅ Auto-seeding completed:');
        console.log(`   - Created ${modules.length} modules`);
        console.log(`   - Created ${permissions.length} permissions`);
        console.log(`   - Created 1 role (Super Admin)`);
        console.log(`   - Created 1 group (Administrators)`);
        console.log(`   - Created 1 user (admin@example.com / Admin123!)`);
        console.log(`   - Established all relationships`);
    }
    catch (error) {
        console.error('💥 Auto-seeding failed:', error);
        throw error;
    }
};
exports.default = sequelize;
