require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

// --------------- Middleware ---------------
app.use(helmet({
  contentSecurityPolicy: false,  // Allow inline scripts for frontend
  crossOriginEmbedderPolicy: false,
}));
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// --------------- Static Files ---------------
app.use(express.static(path.join(__dirname, '..', 'public')));

// --------------- API Routes ---------------
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);

// --------------- Health Check ---------------
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// --------------- SPA Fallback ---------------
// Serve frontend pages — always fall back to index.html
app.get('*', (req, res) => {
  const publicDir = path.join(__dirname, '..', 'public');
  const requestedPage = req.path.endsWith('.html') ? req.path : '/index.html';
  const filePath = path.join(publicDir, requestedPage);

  // Check if file exists, otherwise serve index.html
  const fs = require('fs');
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.sendFile(path.join(publicDir, 'index.html'));
  }
});

// --------------- Error Handling ---------------
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// --------------- Start Server ---------------
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📁 Serving static files from /public`);
    console.log(`🌐 http://localhost:${PORT}`);
  });

  // Graceful shutdown
  const shutdown = (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(() => {
      const mongoose = require('mongoose');
      mongoose.connection.close(false, () => {
        console.log('MongoDB connection closed.');
        process.exit(0);
      });
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

startServer();

module.exports = app;
