const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// List all users in the system (useful for assignees and invitations)
const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      },
      orderBy: { name: 'asc' }
    });

    return res.status(200).json(users);
  } catch (error) {
    console.error('Get Users Error:', error);
    return res.status(500).json({ error: 'Internal server error listing users.' });
  }
};

// Update user role (Admin only)
const updateUserRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!role || (role !== 'ADMIN' && role !== 'MEMBER')) {
    return res.status(400).json({ error: "Invalid role value. Must be 'ADMIN' or 'MEMBER'." });
  }

  try {
    // Prevent the user from updating their own role to avoid self-lockout
    if (req.user.id === id) {
      return res.status(400).json({ error: 'You cannot change your own admin role.' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });

    return res.status(200).json({
      message: 'User role updated successfully!',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update User Role Error:', error);
    return res.status(500).json({ error: 'Internal server error changing user role.' });
  }
};

module.exports = {
  getUsers,
  updateUserRole
};
