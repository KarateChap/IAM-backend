import dotenv from 'dotenv';
import { createApp } from './app';
import { initDatabase } from './config/database';

// Load environment variables
dotenv.config();

// Create Express server
const app = createApp();
const port = process.env.PORT || 3000;

// Start server
const startServer = async () => {
  try {
    console.log('🚀 Starting server initialization...');
    
    // Initialize database
    console.log('📊 Initializing database...');
    await initDatabase();
    console.log('✅ Database initialization completed');

    // Start server
    console.log('🌐 Starting HTTP server...');
    const server = app.listen(port, () => {
      console.log(`✅ Server successfully listening on port ${port}`);
      console.log(`🔗 API available at: http://localhost:${port}`);
    });
    
    server.on('error', (err: any) => {
      console.error('❌ Server failed to start:', err);
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${port} is already in use`);
      }
      process.exit(1);
    });
    
  } catch (error) {
    console.error('💥 Failed to start server:', error);
    console.error('Stack trace:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
