const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-task-manager-token-key-12345';

// Sign a JWT Token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
};

// Signup Controller
const signup = async (req, res) => {
  const { email, password, name, role } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  try {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered.' });
    }

    // Check if this is the first user. First user becomes ADMIN.
    const userCount = await prisma.user.count();
    const assignedRole = userCount === 0 ? 'ADMIN' : (role === 'ADMIN' ? 'ADMIN' : 'MEMBER');

    // Hash Password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create User
    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: assignedRole
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    const token = generateToken(newUser.id);

    return res.status(201).json({
      message: 'Signup successful!',
      token,
      user: newUser
    });
  } catch (error) {
    console.error('Signup Error:', error);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  }
};

// Login Controller
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    // Find User
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Compare Password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(user.id);

    // Exclude password hash from response
    const { passwordHash, ...userWithoutPassword } = user;

    return res.status(200).json({
      message: 'Login successful!',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
};

// Get current user profile (Me)
const getMe = async (req, res) => {
  try {
    // req.user is already populated by authenticateToken middleware
    return res.status(200).json({ user: req.user });
  } catch (error) {
    console.error('Get Me Error:', error);
    return res.status(500).json({ error: 'Internal server error fetching user profile.' });
  }
};

module.exports = {
  signup,
  login,
  getMe
};
