const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-task-manager-token-key-12345';

// Verify User JWT Token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Fetch user from DB to ensure they still exist and check latest role
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, name: true, role: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found. Authentication revoked.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('JWT Verification Error:', error);
    return res.status(403).json({ error: 'Invalid or expired session token.' });
  }
};

// Enforce Admin Only RBAC
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden: Admin privileges required.' });
  }

  next();
};

// Enforce that the user belongs to the project (either as Owner, Member, or Admin)
const isProjectParticipant = async (req, res, next) => {
  const projectId = req.params.projectId || req.params.id || req.body.projectId;

  if (!projectId) {
    return res.status(400).json({ error: 'Project ID is required.' });
  }

  try {
    if (req.user.role === 'ADMIN') {
      return next(); // Admins have master access to all projects
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          select: { id: true }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    const isMember = project.members.some(m => m.id === req.user.id) || project.ownerId === req.user.id;

    if (!isMember) {
      return res.status(403).json({ error: 'Access denied: You are not a member of this project.' });
    }

    next();
  } catch (error) {
    console.error('Project Access Error:', error);
    return res.status(500).json({ error: 'Internal server error validating project access.' });
  }
};

module.exports = {
  authenticateToken,
  isAdmin,
  isProjectParticipant
};
