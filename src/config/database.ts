import { Sequelize } from 'sequelize';

// Initialize SQLite in-memory database for development/testing
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: ':memory:', // Using in-memory SQLite database as required
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: true, // Adds createdAt and updatedAt to models
    // underscored: true, // Commented out to avoid column name conflicts
  },
});

// Export sequelize instance for use in models
export { sequelize };

// Function to initialize database connection and sync models
export const initDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    
    // Set NODE_ENV to development if not defined (for testing purposes)
    if (!process.env.NODE_ENV) {
      process.env.NODE_ENV = 'development';
    }
    
    // Import models only after sequelize instance is exported
    console.log('📦 Loading models and setting up associations...');
    const { initModels } = await import('../models/index');
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
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
};

/**
 * Auto-seed the database with initial data
 * This runs automatically on server startup in development mode
 */
const autoSeedDatabase = async (): Promise<void> => {
  try {
    // Import models dynamically to avoid circular dependencies
    const User = (await import('../models/user.model')).default;
    const { Group } = await import('../models/group.model');
    const { Role } = await import('../models/role.model');
    const { Module } = await import('../models/module.model');
    const { Permission } = await import('../models/permission.model');
    const { UserGroup } = await import('../models/userGroup.model');
    const { GroupRole } = await import('../models/groupRole.model');
    const { RolePermission } = await import('../models/rolePermission.model');

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
    const actions: ('create' | 'read' | 'update' | 'delete')[] = ['create', 'read', 'update', 'delete'];
    
    for (const module of modules) {
      // Access properties safely to avoid Sequelize shadowing issues
      const moduleName = module.get('name') as string;
      const moduleId = module.get('id') as number;
      
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
  } catch (error) {
    console.error('💥 Auto-seeding failed:', error);
    throw error;
  }
};

export default sequelize;
