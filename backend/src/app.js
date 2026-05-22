require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS with support for frontend clients
app.use(cors({
  origin: '*', // We can change this to specific origin when setting up dev client
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// API route hooks
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

// Temporary debug route to inspect paths on Railway
app.get('/api/debug-paths', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  
  const debugInfo = {
    cwd: process.cwd(),
    dirname: __dirname,
    resolvedDistPath: path.resolve(__dirname, '../../frontend/dist'),
    resolvedIndexPath: path.resolve(__dirname, '../../frontend/dist/index.html'),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT
    }
  };

  try {
    debugInfo.distExists = fs.existsSync(debugInfo.resolvedDistPath);
    if (debugInfo.distExists) {
      debugInfo.distContents = fs.readdirSync(debugInfo.resolvedDistPath);
    } else {
      const parentPath = path.resolve(__dirname, '../../frontend');
      debugInfo.frontendExists = fs.existsSync(parentPath);
      if (debugInfo.frontendExists) {
        debugInfo.frontendContents = fs.readdirSync(parentPath);
      } else {
        const rootPath = path.resolve(__dirname, '../..');
        debugInfo.rootContents = fs.readdirSync(rootPath);
      }
    }
  } catch (err) {
    debugInfo.error = err.message;
  }

  res.json(debugInfo);
});

const path = require('path');

// Serve static assets in production
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// Wildcard route to serve the React index.html for non-API routes (HTML5 history API fallback)
app.get(/^(?!\/api).*/, (req, res) => {
  const indexPath = path.join(__dirname, '../../frontend/dist/index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error(`[Static Serve Error] Failed to send index.html at ${indexPath}:`, err.message);
      res.status(500).send('Frontend build files not found. Please ensure the project is fully built on Railway.');
    }
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack);
  res.status(500).json({ error: 'Something went wrong on the server!' });
});

// Start Express Server
const server = app.listen(PORT, () => {
  console.log(`=============================================`);
  console.log(`🚀 Team Task Manager REST API Server is online!`);
  console.log(`📡 Listening on: http://localhost:${PORT}`);
  console.log(`📅 Node Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`=============================================`);
});

module.exports = app;
