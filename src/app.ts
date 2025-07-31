import express, { Express } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.middleware';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import groupRoutes from './routes/group.routes';
import roleRoutes from './routes/role.routes';
import moduleRoutes from './routes/module.routes';
import permissionRoutes from './routes/permission.routes';
import userGroupRoutes from './routes/userGroup.routes';
import groupRoleRoutes from './routes/groupRole.routes';
import rolePermissionRoutes from './routes/rolePermission.routes';
import userPermissionRoutes from './routes/userPermission.routes';

export const createApp = (): Express => {
  const app: Express = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Only use morgan in non-test environments
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // Register routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/groups', groupRoutes);
  app.use('/api/roles', roleRoutes);
  app.use('/api/modules', moduleRoutes);
  app.use('/api/permissions', permissionRoutes);

  // Register relationship routes
  app.use('/api', userGroupRoutes);
  app.use('/api', groupRoleRoutes);
  app.use('/api', rolePermissionRoutes);
  app.use('/api', userPermissionRoutes);

  // Test route
  app.get('/', (req, res) => {
    res.json({ message: 'Welcome to IAM-Style Access Control System API' });
  });

  // Handle 404 errors for unhandled routes
  app.use(notFoundHandler);

  // Global error handling middleware
  app.use(errorHandler);

  return app;
};
