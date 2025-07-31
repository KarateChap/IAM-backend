"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const errorHandler_middleware_1 = require("./middlewares/errorHandler.middleware");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const group_routes_1 = __importDefault(require("./routes/group.routes"));
const role_routes_1 = __importDefault(require("./routes/role.routes"));
const module_routes_1 = __importDefault(require("./routes/module.routes"));
const permission_routes_1 = __importDefault(require("./routes/permission.routes"));
const userGroup_routes_1 = __importDefault(require("./routes/userGroup.routes"));
const groupRole_routes_1 = __importDefault(require("./routes/groupRole.routes"));
const rolePermission_routes_1 = __importDefault(require("./routes/rolePermission.routes"));
const userPermission_routes_1 = __importDefault(require("./routes/userPermission.routes"));
const createApp = () => {
    const app = (0, express_1.default)();
    // Middleware
    app.use((0, cors_1.default)());
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({ extended: true }));
    // Only use morgan in non-test environments
    if (process.env.NODE_ENV !== 'test') {
        app.use((0, morgan_1.default)('dev'));
    }
    // Register routes
    app.use('/api/auth', auth_routes_1.default);
    app.use('/api/users', user_routes_1.default);
    app.use('/api/groups', group_routes_1.default);
    app.use('/api/roles', role_routes_1.default);
    app.use('/api/modules', module_routes_1.default);
    app.use('/api/permissions', permission_routes_1.default);
    // Register relationship routes
    app.use('/api', userGroup_routes_1.default);
    app.use('/api', groupRole_routes_1.default);
    app.use('/api', rolePermission_routes_1.default);
    app.use('/api', userPermission_routes_1.default);
    // Test route
    app.get('/', (req, res) => {
        res.json({ message: 'Welcome to IAM-Style Access Control System API' });
    });
    // Handle 404 errors for unhandled routes
    app.use(errorHandler_middleware_1.notFoundHandler);
    // Global error handling middleware
    app.use(errorHandler_middleware_1.errorHandler);
    return app;
};
exports.createApp = createApp;
