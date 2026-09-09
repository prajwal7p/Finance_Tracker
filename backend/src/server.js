const app = require('./app');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const seedDefaultCategories = require('./utils/seedCategories');

const PORT = process.env.PORT || 5000;
const requiredProductionVariables = ['MONGO_URI', 'JWT_SECRET', 'CLIENT_URL'];

const validateEnvironment = () => {
  if (process.env.NODE_ENV !== 'production') return;

  const missing = requiredProductionVariables.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(`Missing required production environment variables: ${missing.join(', ')}`);
  }

  if (process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters in production');
  }
};

let server;

const start = async () => {
  validateEnvironment();
  await connectDB();
  await seedDefaultCategories();

  server = app.listen(PORT, () => {
    console.log(`[FinTrack AI Backend] Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
};

const shutdown = (signal) => {
  console.log(`[FinTrack AI Backend] Received ${signal}; shutting down gracefully`);
  if (!server) process.exit(1);
  server.close(async () => {
    await mongoose.connection.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`[Unhandled Rejection] Error: ${err.message}`);
  shutdown('unhandled rejection');
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error(`[Uncaught Exception] Error: ${err.message}`);
  shutdown('uncaught exception');
});

start().catch((error) => {
  console.error(`[Startup Error] ${error.message}`);
  process.exit(1);
});
