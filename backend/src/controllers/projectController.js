const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all projects for current user (Admins see all; Members see assigned projects)
const getProjects = async (req, res) => {
  try {
    let projects;
    
    if (req.user.role === 'ADMIN') {
      projects = await prisma.project.findMany({
        include: {
          owner: {
            select: { id: true, name: true, email: true }
          },
          members: {
            select: { id: true, name: true, email: true, role: true }
          },
          _count: {
            select: { tasks: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      projects = await prisma.project.findMany({
        where: {
          OR: [
            { ownerId: req.user.id },
            { members: { some: { id: req.user.id } } }
          ]
        },
        include: {
          owner: {
            select: { id: true, name: true, email: true }
          },
          members: {
            select: { id: true, name: true, email: true, role: true }
          },
          _count: {
            select: { tasks: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    return res.status(200).json(projects);
  } catch (error) {
    console.error('Get Projects Error:', error);
    return res.status(500).json({ error: 'Internal server error fetching projects.' });
  }
};

// Get single project details (including tasks and members)
const getProjectById = async (req, res) => {
  const { id } = req.params;

  try {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        members: {
          select: { id: true, name: true, email: true, role: true }
        },
        tasks: {
          include: {
            assignee: {
              select: { id: true, name: true, email: true, role: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    return res.status(200).json(project);
  } catch (error) {
    console.error('Get Project By ID Error:', error);
    return res.status(500).json({ error: 'Internal server error fetching project details.' });
  }
};

// Create a new project (Admin only)
const createProject = async (req, res) => {
  const { name, description, memberIds } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Project name is required.' });
  }

  try {
    // Collect connect objects for members
    const connectMembers = [{ id: req.user.id }]; // Owner is always member
    if (memberIds && Array.isArray(memberIds)) {
      memberIds.forEach(id => {
        if (id !== req.user.id) {
          connectMembers.push({ id });
        }
      });
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        ownerId: req.user.id,
        members: {
          connect: connectMembers
        }
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        members: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return res.status(201).json({
      message: 'Project created successfully!',
      project
    });
  } catch (error) {
    console.error('Create Project Error:', error);
    return res.status(500).json({ error: 'Internal server error creating project.' });
  }
};

// Update project description or name (Admin only)
const updateProject = async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  try {
    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        name,
        description
      }
    });

    return res.status(200).json({
      message: 'Project updated successfully!',
      project: updatedProject
    });
  } catch (error) {
    console.error('Update Project Error:', error);
    return res.status(500).json({ error: 'Internal server error updating project.' });
  }
};

// Delete project (Admin only)
const deleteProject = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.project.delete({
      where: { id }
    });

    return res.status(200).json({ message: 'Project deleted successfully!' });
  } catch (error) {
    console.error('Delete Project Error:', error);
    return res.status(500).json({ error: 'Internal server error deleting project.' });
  }
};

// Invite / Add a member to project (Admin only)
const addMemberToProject = async (req, res) => {
  const { id } = req.params; // project id
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required.' });
  }

  try {
    const project = await prisma.project.update({
      where: { id },
      data: {
        members: {
          connect: { id: userId }
        }
      },
      include: {
        members: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return res.status(200).json({
      message: 'Team member added successfully!',
      members: project.members
    });
  } catch (error) {
    console.error('Add Member Error:', error);
    return res.status(500).json({ error: 'Internal server error adding project member.' });
  }
};

// Remove a member from project (Admin only)
const removeMemberFromProject = async (req, res) => {
  const { id, userId } = req.params; // id = project id, userId = user to remove

  try {
    // Fetch project to ensure we don't remove the owner
    const projectCheck = await prisma.project.findUnique({
      where: { id },
      select: { ownerId: true }
    });

    if (projectCheck && projectCheck.ownerId === userId) {
      return res.status(400).json({ error: 'Cannot remove the project owner from the project team.' });
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        members: {
          disconnect: { id: userId }
        }
      },
      include: {
        members: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Unassign tasks in this project currently assigned to this user
    await prisma.task.updateMany({
      where: {
        projectId: id,
        assigneeId: userId
      },
      data: {
        assigneeId: null
      }
    });

    return res.status(200).json({
      message: 'Team member removed successfully!',
      members: project.members
    });
  } catch (error) {
    console.error('Remove Member Error:', error);
    return res.status(500).json({ error: 'Internal server error removing project member.' });
  }
};

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addMemberToProject,
  removeMemberFromProject
};
