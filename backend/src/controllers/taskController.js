const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get tasks for a project
const getTasksByProject = async (req, res) => {
  const { projectId } = req.params;

  try {
    const tasks = await prisma.task.findMany({
      where: { projectId },
      include: {
        assignee: {
          select: { id: true, name: true, email: true, role: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json(tasks);
  } catch (error) {
    console.error('Get Tasks Error:', error);
    return res.status(500).json({ error: 'Internal server error fetching tasks.' });
  }
};

// Get single task details
const getTaskById = async (req, res) => {
  const { id } = req.params;

  try {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignee: {
          select: { id: true, name: true, email: true }
        },
        project: {
          select: { id: true, name: true, ownerId: true }
        }
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    // Access check: User must be Admin or belong to the project
    if (req.user.role !== 'ADMIN') {
      const project = await prisma.project.findUnique({
        where: { id: task.projectId },
        include: { members: { select: { id: true } } }
      });

      const isMember = project.members.some(m => m.id === req.user.id) || project.ownerId === req.user.id;
      if (!isMember) {
        return res.status(403).json({ error: 'Access denied to this task.' });
      }
    }

    return res.status(200).json(task);
  } catch (error) {
    console.error('Get Task By ID Error:', error);
    return res.status(500).json({ error: 'Internal server error fetching task.' });
  }
};

// Create a task
const createTask = async (req, res) => {
  const { projectId } = req.params;
  const { title, description, status, priority, assigneeId, dueDate } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Task title is required.' });
  }

  try {
    // If assigneeId is provided, verify they are in the project team or an Admin
    if (assigneeId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { members: { select: { id: true } } }
      });

      const isMember = project.members.some(m => m.id === assigneeId) || project.ownerId === assigneeId;
      if (!isMember) {
        return res.status(400).json({ error: 'Assigned user must be a member of the project team.' });
      }
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || 'TODO',
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId,
        assigneeId: assigneeId || null
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return res.status(201).json({
      message: 'Task created successfully!',
      task
    });
  } catch (error) {
    console.error('Create Task Error:', error);
    return res.status(500).json({ error: 'Internal server error creating task.' });
  }
};

// Update a task
const updateTask = async (req, res) => {
  const { id } = req.params;
  const { title, description, status, priority, assigneeId, dueDate } = req.body;

  try {
    const task = await prisma.task.findUnique({
      where: { id }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    // Access check: User must belong to the task's project
    if (req.user.role !== 'ADMIN') {
      const project = await prisma.project.findUnique({
        where: { id: task.projectId },
        include: { members: { select: { id: true } } }
      });

      const isMember = project.members.some(m => m.id === req.user.id) || project.ownerId === req.user.id;
      if (!isMember) {
        return res.status(403).json({ error: 'Access denied: You are not a member of the project containing this task.' });
      }
    }

    // If assigneeId is provided, verify they are in the project team
    if (assigneeId) {
      const project = await prisma.project.findUnique({
        where: { id: task.projectId },
        include: { members: { select: { id: true } } }
      });

      const isMember = project.members.some(m => m.id === assigneeId) || project.ownerId === assigneeId;
      if (!isMember) {
        return res.status(400).json({ error: 'Assigned user must be a member of the project team.' });
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        title: title !== undefined ? title : task.title,
        description: description !== undefined ? description : task.description,
        status: status !== undefined ? status : task.status,
        priority: priority !== undefined ? priority : task.priority,
        assigneeId: assigneeId !== undefined ? assigneeId : task.assigneeId,
        dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : task.dueDate
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return res.status(200).json({
      message: 'Task updated successfully!',
      task: updatedTask
    });
  } catch (error) {
    console.error('Update Task Error:', error);
    return res.status(500).json({ error: 'Internal server error updating task.' });
  }
};

// Delete a task
const deleteTask = async (req, res) => {
  const { id } = req.params;

  try {
    const task = await prisma.task.findUnique({
      where: { id }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    // Access check: Admins can always delete. Members must belong to the project.
    if (req.user.role !== 'ADMIN') {
      const project = await prisma.project.findUnique({
        where: { id: task.projectId },
        include: { members: { select: { id: true } } }
      });

      const isMember = project.members.some(m => m.id === req.user.id) || project.ownerId === req.user.id;
      if (!isMember) {
        return res.status(403).json({ error: 'Access denied: You are not a member of the project containing this task.' });
      }
    }

    await prisma.task.delete({
      where: { id }
    });

    return res.status(200).json({ message: 'Task deleted successfully!' });
  } catch (error) {
    console.error('Delete Task Error:', error);
    return res.status(500).json({ error: 'Internal server error deleting task.' });
  }
};

module.exports = {
  getTasksByProject,
  getTaskById,
  createTask,
  updateTask,
  deleteTask
};
