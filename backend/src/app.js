require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

// Dynamic & Resilient DATABASE_URL resolution
const fs = require('fs');
const path = require('path');

let prismaDir = path.join(__dirname, '../prisma');
if (!fs.existsSync(prismaDir)) {
  prismaDir = path.join(__dirname, './prisma');
}
if (!fs.existsSync(prismaDir)) {
  const possiblePrismaPaths = [
    path.join(__dirname, '../prisma'),
    path.join(__dirname, '../../backend/prisma'),
    path.join(__dirname, './prisma')
  ];
  for (const p of possiblePrismaPaths) {
    if (fs.existsSync(p)) {
      prismaDir = p;
      break;
    }
  }
}

// Make sure prisma directory exists, if not, create it
if (!fs.existsSync(prismaDir)) {
  try {
    fs.mkdirSync(prismaDir, { recursive: true });
  } catch (err) {
    console.error("Failed to create prisma directory:", err);
  }
}

const dbPath = path.join(prismaDir, 'dev.db');
process.env.DATABASE_URL = `file:${dbPath}`;
console.log(`[Database Setup] Dynamically resolved DATABASE_URL to: ${process.env.DATABASE_URL}`);

const express = require('express');
const cors = require('cors');

let authRoutes, projectRoutes, taskRoutes, userRoutes;
let startupError = null;

try {
  authRoutes = require('./routes/authRoutes');
  projectRoutes = require('./routes/projectRoutes');
  taskRoutes = require('./routes/taskRoutes');
  userRoutes = require('./routes/userRoutes');
} catch (err) {
  console.error("Startup router import error:", err);
  startupError = err.message + "\n" + err.stack;
}

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
if (startupError) {
  app.use('/api', (req, res) => {
    res.status(500).json({
      status: 'startup_error',
      error: startupError,
      message: 'The server failed to initialize its database client or routes. See error details.',
      timestamp: new Date()
    });
  });
} else {
  app.use('/api/auth', authRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/users', userRoutes);
}

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

app.get('/api/debug-paths', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  
  const debugInfo = {
    cwd: process.cwd(),
    dirname: __dirname,
    env: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT
    }
  };

  try {
    debugInfo.appContents = fs.readdirSync('/app');
    if (fs.existsSync('/app/frontend')) {
      debugInfo.frontendExists = true;
      debugInfo.frontendContents = fs.readdirSync('/app/frontend');
      if (fs.existsSync('/app/frontend/dist')) {
        debugInfo.distExists = true;
        debugInfo.distContents = fs.readdirSync('/app/frontend/dist');
      } else {
        debugInfo.distExists = false;
      }
    } else {
      debugInfo.frontendExists = false;
    }
  } catch (err) {
    debugInfo.error = err.message;
  }

  res.json(debugInfo);
});

// Self-healing path discovery for frontend static files
const possibleDistPaths = [
  path.join(__dirname, '../../frontend/dist'),
  path.join(__dirname, '../frontend/dist'),
  path.join(__dirname, '../dist'),
  path.join(__dirname, './dist'),
  path.join(__dirname, '../../dist')
];

let distPath = possibleDistPaths[0]; // Default fallback
for (const p of possibleDistPaths) {
  if (fs.existsSync(path.join(p, 'index.html'))) {
    distPath = p;
    console.log(`[Static Serve] Found frontend build files at: ${distPath}`);
    break;
  }
}

// Serve static assets in production
app.use(express.static(distPath));

// Wildcard route to serve the React index.html for non-API routes (HTML5 history API fallback)
app.get(/^(?!\/api).*/, (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error(`[Static Serve Error] Failed to send index.html at ${indexPath}:`, err.message);
      res.status(500).send(`Frontend build files not found. Active search path: ${distPath}. Please ensure the project is fully built on Railway.`);
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

  // Run Prisma DB Push asynchronously after server starts to ensure immediate port binding
  const { exec } = require('child_process');
  let schemaPath = path.join(__dirname, '../prisma/schema.prisma');
  if (!fs.existsSync(schemaPath)) {
    schemaPath = path.join(__dirname, './prisma/schema.prisma');
  }
  if (!fs.existsSync(schemaPath)) {
    const possibleSchemaPaths = [
      path.join(__dirname, '../prisma/schema.prisma'),
      path.join(__dirname, '../../backend/prisma/schema.prisma'),
      path.join(__dirname, './prisma/schema.prisma')
    ];
    for (const p of possibleSchemaPaths) {
      if (fs.existsSync(p)) {
        schemaPath = p;
        break;
      }
    }
  }

  if (fs.existsSync(schemaPath)) {
    console.log(`[Database Push] Found schema at: ${schemaPath}. Starting background push...`);
    exec(`npx prisma db push --schema="${schemaPath}" --accept-data-loss`, (err, stdout, stderr) => {
      if (err) {
        console.error("[Database Push Error] Background Prisma push failed:", err.message);
        console.error(stderr);
      } else {
        console.log("[Database Push Success] Background Prisma push completed successfully:\n", stdout);
      }
    });
  } else {
    console.warn("[Database Push Warning] Prisma schema not found. Skipping background push.");
  }
});

module.exports = app;
