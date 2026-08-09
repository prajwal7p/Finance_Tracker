const app = require('./app');
const connectDB = require('./config/db');
const seedDefaultCategories = require('./utils/seedCategories');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB & seed categories
connectDB().then(() => {
  seedDefaultCategories();
});

const server = app.listen(PORT, () => {
  console.log(`[FinTrack AI Backend] Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`[Unhandled Rejection] Error: ${err.message}`);
  // In production, server might gracefully close
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error(`[Uncaught Exception] Error: ${err.message}`);
});
