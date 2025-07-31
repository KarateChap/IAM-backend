"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const app_1 = require("./app");
const database_1 = require("./config/database");
// Load environment variables
dotenv_1.default.config();
// Create Express server
const app = (0, app_1.createApp)();
const port = process.env.PORT || 3000;
// Start server
const startServer = async () => {
    try {
        console.log('🚀 Starting server initialization...');
        // Initialize database
        console.log('📊 Initializing database...');
        await (0, database_1.initDatabase)();
        console.log('✅ Database initialization completed');
        // Start server
        console.log('🌐 Starting HTTP server...');
        const server = app.listen(port, () => {
            console.log(`✅ Server successfully listening on port ${port}`);
            console.log(`🔗 API available at: http://localhost:${port}`);
        });
        server.on('error', (err) => {
            console.error('❌ Server failed to start:', err);
            if (err.code === 'EADDRINUSE') {
                console.error(`❌ Port ${port} is already in use`);
            }
            process.exit(1);
        });
    }
    catch (error) {
        console.error('💥 Failed to start server:', error);
        console.error('Stack trace:', error);
        process.exit(1);
    }
};
// Start the server
startServer();
