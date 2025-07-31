# 🔐 IAM Backend System

A comprehensive Identity and Access Management (IAM) backend system built with Node.js, Express.js, TypeScript, and Sequelize ORM. This system provides complete user authentication, authorization, and permission management capabilities.

## 🚀 Features

### 🔑 Authentication & Authorization

- **JWT-based Authentication** - Secure token-based authentication
- **Password Security** - bcryptjs hashing with salt rounds
- **Route Protection** - Middleware-based route security
- **Permission-based Access Control** - Granular permission system

### 👥 User Management

- **User CRUD Operations** - Complete user lifecycle management
- **Group Management** - Organize users into groups
- **Role Management** - Define roles with specific permissions
- **Permission Management** - Fine-grained permission control

### 🏗️ System Architecture

- **Service Layer Architecture** - Clean separation of concerns
- **Centralized Error Handling** - Consistent error responses
- **Input Validation** - express-validator integration
- **Audit Logging** - Comprehensive system monitoring
- **Auto Database Seeding** - Development environment setup

### 📊 Advanced Features

- **Cascade Delete Operations** - Intelligent data cleanup
- **Permission Inheritance** - Users inherit permissions through groups
- **System Health Monitoring** - Real-time system status
- **Permission Simulation** - Test user permissions before assignment

## 🛠️ Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Sequelize (Code First)
- **Database**: SQLite (in-memory for development)
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjsß
- **Validation**: express-validator
- **Testing**: Jest
- **Development**: nodemon, ts-node

## 📋 Prerequisites

- Node.js 18 or higher
- npm or yarn package manager

## 🚀 Quick Start

### 1. Installation

```bash
# Clone the repository
git clone <repository-url>
cd backend

# Install dependencies
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h

# Database Configuration (SQLite in-memory for development)
DB_DIALECT=sqlite
DB_STORAGE=:memory:

FRONTEND_URL=http://localhost:5173
```

### 3. Development Server

```bash
# Start development server with auto-reload
npm run dev

# Or start production server
npm start
```

The server will start on `http://localhost:3000`

### 4. Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts          # Database configuration
│   │   └── cors.ts              # CORS configuration
│   ├── controllers/             # HTTP request handlers
│   │   ├── auth.controller.ts   # Authentication endpoints
│   │   ├── user.controller.ts   # User management
│   │   ├── group.controller.ts  # Group management
│   │   ├── role.controller.ts   # Role management
│   │   └── ...
│   ├── middlewares/             # Express middlewares
│   │   ├── auth.middleware.ts   # JWT authentication
│   │   ├── permission.middleware.ts # Permission checking
│   │   └── errorHandler.middleware.ts # Error handling
│   ├── models/                  # Sequelize models
│   │   ├── user.model.ts        # User model
│   │   ├── group.model.ts       # Group model
│   │   ├── role.model.ts        # Role model
│   │   └── ...
│   ├── routes/                  # API route definitions
│   │   ├── auth.routes.ts       # Authentication routes
│   │   ├── user.routes.ts       # User routes
│   │   └── ...
│   ├── services/                # Business logic layer
│   │   ├── auth.service.ts      # Authentication logic
│   │   ├── user.service.ts      # User business logic
│   │   ├── audit.service.ts     # System monitoring
│   │   └── ...
│   ├── utils/                   # Utility functions
│   │   ├── errors.ts            # Custom error classes
│   │   ├── jwt.utils.ts         # JWT utilities
│   │   └── ...
│   ├── validators/              # Input validation schemas
│   │   ├── auth.validator.ts    # Auth validation
│   │   └── ...
│   ├── seeders/                 # Database seeders
│   │   └── development.seeder.ts # Dev data seeder
│   └── app.ts                   # Express app setup
├── tests/                       # Test files
│   ├── unit/                    # Unit tests
│   │   ├── controllers/         # Controller tests
│   │   ├── services/            # Service tests
│   │   ├── middlewares/         # Middleware tests
│   │   └── utils/               # Utility tests
│   └── integration/             # Integration tests
├── package.json                 # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── jest.config.js              # Jest configuration
└── README.md                   # This file
```

## 🔗 API Endpoints

### Authentication

```
POST /api/auth/register    # User registration
POST /api/auth/login       # User login
GET  /api/me/permissions   # Get current user permissions
POST /api/simulate-action  # Simulate permission check
```

### User Management

```
GET    /api/users          # List users (with pagination)
GET    /api/users/:id      # Get user by ID
POST   /api/users          # Create new user
PUT    /api/users/:id      # Update user
DELETE /api/users/:id      # Delete user
```

### Group Management

```
GET    /api/groups         # List groups
GET    /api/groups/:id     # Get group by ID
POST   /api/groups         # Create new group
PUT    /api/groups/:id     # Update group
DELETE /api/groups/:id     # Delete group
POST   /api/groups/:id/users    # Assign users to group
POST   /api/groups/:id/roles    # Assign roles to group
```

### Role Management

```
GET    /api/roles          # List roles
GET    /api/roles/:id      # Get role by ID
POST   /api/roles          # Create new role
PUT    /api/roles/:id      # Update role
DELETE /api/roles/:id      # Delete role
POST   /api/roles/:id/permissions # Assign permissions to role
```

### Module & Permission Management

```
GET    /api/modules        # List modules
POST   /api/modules        # Create module
PUT    /api/modules/:id    # Update module
DELETE /api/modules/:id    # Delete module (cascade)

GET    /api/permissions    # List permissions
POST   /api/permissions    # Create permission
PUT    /api/permissions/:id # Update permission
DELETE /api/permissions/:id # Delete permission
```

## 🔐 Permission System

### Permission Structure

The IAM system uses a hierarchical permission model:

```
Users → Groups → Roles → Permissions → Modules
```

### Permission Types

- **create** - Create new resources
- **read** - View/list resources
- **update** - Modify existing resources
- **delete** - Remove resources

### Modules

- **Users** - User management permissions
- **Groups** - Group management permissions
- **Roles** - Role management permissions
- **Modules** - Module management permissions
- **Permissions** - Permission management permissions
- **Assignments** - Assignment operation permissions

### Usage Example

```typescript
// Check if user can create users
const canCreateUsers = checkPermission(userPermissions, 'Users', 'create');

// Middleware protection
app.get('/api/users', requireAuth, checkPermission('Users', 'read'), userController.getUsers);
```

## 🧪 Testing

The system includes comprehensive test coverage:

### Test Statistics

- **Total Test Suites**: 27
- **Total Tests**: 432
- **Coverage**: 100% of critical functionality

### Test Categories

- **Unit Tests**: Controllers, Services, Middlewares, Utils
- **Validation Tests**: Input validation scenarios
- **Error Handling Tests**: Error scenarios and edge cases

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- tests/unit/services/user.service.test.ts

# Run tests with coverage report
npm run test:coverage

# Run tests in watch mode during development
npm run test:watch
```

## 🔧 Development

### Code Style

- **TypeScript**: Strict type checking enabled
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting (if configured)

### Development Workflow

1. Make changes to source code
2. Tests run automatically (if in watch mode)
3. Server reloads automatically with nodemon
4. Database is seeded on each restart

### Adding New Features

1. Create/update models in `src/models/`
2. Add business logic in `src/services/`
3. Create controllers in `src/controllers/`
4. Define routes in `src/routes/`
5. Add validation in `src/validators/`
6. Write tests in `tests/`

## 🚀 Production Deployment

### Environment Variables

Ensure all production environment variables are set:

```env
NODE_ENV=production
JWT_SECRET=your-production-jwt-secret
DB_HOST=your-database-host
DB_NAME=your-database-name
DB_USER=your-database-user
DB_PASS=your-database-password
```

### Build Process

```bash
# Install production dependencies
npm ci --only=production

# Build TypeScript
npm run build

# Start production server
npm start
```

### Database Setup

For production, replace SQLite with a production database:

1. Update `src/config/database.ts`
2. Install appropriate database driver
3. Run migrations if needed
4. Seed initial data

## 📊 Monitoring & Logging

### Audit Logging

All system operations are logged with:

- User ID and username
- Action performed
- Resource affected
- Timestamp
- IP address and user agent
- Additional details

### System Health

Monitor system health via:

```
GET /api/system/health
```

Returns database status, model counts, and relationship statistics.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add/update tests
5. Ensure all tests pass
6. Submit a pull request

---

**Built with ❤️ for secure and scalable identity management**
