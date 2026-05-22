import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/ProjectDetails.css';

const ProjectDetails = () => {
  const { id } = useParams();
  const { user, fetchWithAuth } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Task Modal State
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null); // null = Creating, object = Editing
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskStatus, setTaskStatus] = useState('TODO');
  const [taskPriority, setTaskPriority] = useState('MEDIUM');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskError, setTaskError] = useState('');
  const [taskSubmitting, setTaskSubmitting] = useState(false);

  // Invite Member State
  const [selectedInviteUser, setSelectedInviteUser] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviteSubmitting, setInviteSubmitting] = useState(false);

  const loadProjectData = async () => {
    try {
      setLoading(true);
      setError('');

      const projData = await fetchWithAuth(`/api/projects/${id}`).then(res => res.json());
      setProject(projData);

      // Fetch all system users to support assignee and invitation selectors
      const usersData = await fetchWithAuth('/api/users').then(res => res.json());
      setAllUsers(usersData);
    } catch (err) {
      console.error('Error fetching project:', err);
      setError(err.message || 'Failed to load project details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjectData();
  }, [id]);

  // Project CRUD: Delete Project
  const handleDeleteProject = async () => {
    if (!window.confirm('Are you absolutely sure you want to delete this project and all its tasks? This action is irreversible.')) {
      return;
    }

    try {
      const res = await fetchWithAuth(`/api/projects/${id}`, { method: 'DELETE' });
      if (res.ok) {
        navigate('/');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete project.');
      }
    } catch (err) {
      alert('Error deleting project: ' + err.message);
    }
  };

  // Team Management: Add member to project
  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedInviteUser) return;

    setInviteError('');
    setInviteSubmitting(true);

    try {
      const res = await fetchWithAuth(`/api/projects/${id}/members`, {
        method: 'POST',
        body: JSON.stringify({ userId: selectedInviteUser })
      });

      const data = await res.json();

      if (res.ok) {
        setSelectedInviteUser('');
        loadProjectData();
      } else {
        setInviteError(data.error || 'Failed to add team member.');
      }
    } catch (err) {
      setInviteError(err.message || 'Error inviting member.');
    } finally {
      setInviteSubmitting(false);
    }
  };

  // Team Management: Remove member from project
  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this member from the project team? Tasks assigned to them in this project will be unassigned.')) {
      return;
    }

    try {
      const res = await fetchWithAuth(`/api/projects/${id}/members/${userId}`, { method: 'DELETE' });
      if (res.ok) {
        loadProjectData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to remove member.');
      }
    } catch (err) {
      alert('Error removing member: ' + err.message);
    }
  };

  // Task CRUD: Create or Edit Submit
  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim()) {
      setTaskError('Task title is required.');
      return;
    }

    setTaskError('');
    setTaskSubmitting(true);

    const taskPayload = {
      title: taskTitle,
      description: taskDesc,
      status: taskStatus,
      priority: taskPriority,
      assigneeId: taskAssignee || null,
      dueDate: taskDueDate || null
    };

    try {
      let res;
      if (editingTask) {
        // Edit Task
        res = await fetchWithAuth(`/api/tasks/${editingTask.id}`, {
          method: 'PUT',
          body: JSON.stringify(taskPayload)
        });
      } else {
        // Create Task
        res = await fetchWithAuth(`/api/tasks/project/${id}`, {
          method: 'POST',
          body: JSON.stringify(taskPayload)
        });
      }

      const data = await res.json();

      if (res.ok) {
        setShowTaskModal(false);
        resetTaskForm();
        loadProjectData();
      } else {
        setTaskError(data.error || 'Failed to save task.');
      }
    } catch (err) {
      setTaskError(err.message || 'Error processing task request.');
    } finally {
      setTaskSubmitting(false);
    }
  };

  // Task CRUD: Quick Shift Status
  const handleShiftTaskStatus = async (task, direction) => {
    const statuses = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];
    const currentIndex = statuses.indexOf(task.status);
    let newIndex = currentIndex + direction;

    if (newIndex < 0 || newIndex >= statuses.length) return;

    try {
      const res = await fetchWithAuth(`/api/tasks/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: statuses[newIndex] })
      });

      if (res.ok) {
        loadProjectData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to shift status.');
      }
    } catch (err) {
      alert('Error updating status: ' + err.message);
    }
  };

  // Task CRUD: Delete Task
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      const res = await fetchWithAuth(`/api/tasks/${taskId}`, { method: 'DELETE' });
      if (res.ok) {
        loadProjectData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete task.');
      }
    } catch (err) {
      alert('Error deleting task: ' + err.message);
    }
  };

  // Helper: Open Modal in edit mode
  const openEditModal = (task) => {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskDesc(task.description || '');
    setTaskStatus(task.status);
    setTaskPriority(task.priority);
    setTaskAssignee(task.assigneeId || '');
    setTaskDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
    setShowTaskModal(true);
  };

  // Helper: Open Modal in create mode
  const openCreateModal = (columnStatus = 'TODO') => {
    setEditingTask(null);
    resetTaskForm();
    setTaskStatus(columnStatus);
    setShowTaskModal(true);
  };

  const resetTaskForm = () => {
    setTaskTitle('');
    setTaskDesc('');
    setTaskStatus('TODO');
    setTaskPriority('MEDIUM');
    setTaskAssignee('');
    setTaskDueDate('');
    setTaskError('');
  };

  if (loading && !project) {
    return (
      <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <h2>Loading project workspace...</h2>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="main-content">
        <div className="auth-error" style={{ marginBottom: '2rem' }}>
          {error || 'Project workspace not found.'}
        </div>
        <Link to="/" className="btn btn-secondary">
          ⬅ Back to Dashboard
        </Link>
      </div>
    );
  }

  // Filter system users available to be invited (not already in team)
  const memberIds = project.members.map(m => m.id);
  const nonMembers = allUsers.filter(u => !memberIds.includes(u.id));

  // Partition tasks by status
  const tasksByStatus = {
    TODO: project.tasks.filter(t => t.status === 'TODO'),
    IN_PROGRESS: project.tasks.filter(t => t.status === 'IN_PROGRESS'),
    REVIEW: project.tasks.filter(t => t.status === 'REVIEW'),
    DONE: project.tasks.filter(t => t.status === 'DONE')
  };

  const columns = [
    { id: 'TODO', title: 'To Do', emoji: '📋', statusClass: 'badge-todo' },
    { id: 'IN_PROGRESS', title: 'In Progress', emoji: '⚡', statusClass: 'badge-in-progress' },
    { id: 'REVIEW', title: 'Review', emoji: '🔍', statusClass: 'badge-review' },
    { id: 'DONE', title: 'Completed', emoji: '✅', statusClass: 'badge-done' }
  ];

  return (
    <div className="main-content">
      {/* Project Workspace Header */}
      <header className="project-details-header">
        <div className="project-details-title-row">
          <h1 className="project-details-title">{project.name}</h1>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to="/" className="btn btn-secondary">
              📊 Back to Dashboard
            </Link>
            {user.role === 'ADMIN' && (
              <button className="btn btn-danger" onClick={handleDeleteProject}>
                🗑️ Delete Project
              </button>
            )}
          </div>
        </div>
        <p className="project-details-desc">{project.description || 'No description added to this workspace.'}</p>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Workspace Owner: <strong style={{ color: 'var(--text-primary)' }}>{project.owner.name}</strong>
        </div>
      </header>

      {/* Grid Layout: Tasks Board + Team Panel */}
      <div className="project-details-grid">
        {/* Kanban Board Container */}
        <div>
          <div className="dashboard-section-title" style={{ margin: '0' }}>
            <span>Project Tasks Board</span>
            <button className="btn btn-primary" onClick={() => openCreateModal('TODO')} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
              ➕ Create Task
            </button>
          </div>

          <div className="kanban-board">
            {columns.map(col => (
              <div key={col.id} className="kanban-column">
                <div className="kanban-column-header">
                  <div className="column-title">
                    <span>{col.emoji}</span> {col.title}
                  </div>
                  <span className="column-count">{tasksByStatus[col.id].length}</span>
                </div>

                <div className="kanban-cards-container">
                  {tasksByStatus[col.id].length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem', border: '1px dashed var(--glass-border)', borderRadius: '12px' }}>
                      No tasks in this stage.
                    </div>
                  ) : (
                    tasksByStatus[col.id].map(task => (
                      <div key={task.id} className="glass-panel card kanban-card" onClick={() => openEditModal(task)}>
                        <div className="card-title-row">
                          <h4 className="card-title">{task.title}</h4>
                          <span className={`badge ${
                            task.priority === 'HIGH' ? 'badge-high' : task.priority === 'MEDIUM' ? 'badge-medium' : 'badge-low'
                          }`} style={{ fontSize: '0.6rem', padding: '0.15rem 0.4rem' }}>
                            {task.priority}
                          </span>
                        </div>

                        {task.description && <p className="card-desc">{task.description}</p>}

                        <div className="card-info">
                          <div className="card-meta-item">
                            <span>👤</span> {task.assignee ? task.assignee.name : 'Unassigned'}
                          </div>
                          {task.dueDate && (
                            <div className="card-meta-item">
                              <span>📅</span> {new Date(task.dueDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>

                        {/* Status Shifts and Delete Control */}
                        <div className="card-footer" onClick={(e) => e.stopPropagation()}>
                          <div className="card-controls">
                            {task.status !== 'TODO' && (
                              <button className="card-control-btn" onClick={() => handleShiftTaskStatus(task, -1)}>
                                ◀
                              </button>
                            )}
                            {task.status !== 'DONE' && (
                              <button className="card-control-btn" onClick={() => handleShiftTaskStatus(task, 1)}>
                                ▶
                              </button>
                            )}
                          </div>
                          
                          <button className="member-remove-btn" onClick={() => handleDeleteTask(task.id)} title="Delete Task">
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team panel */}
        <section className="glass-panel card team-panel">
          <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
            👥 Project Team
          </h3>
          
          <div className="team-list">
            {project.members.map(member => (
              <div key={member.id} className="team-member-item">
                <div className="member-info">
                  <span className="member-name">{member.name}</span>
                  <span className="member-email">{member.email}</span>
                </div>
                {user.role === 'ADMIN' && member.id !== project.ownerId && (
                  <button 
                    className="member-remove-btn" 
                    onClick={() => handleRemoveMember(member.id)}
                    title="Remove member"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add member form (Admin only) */}
          {user.role === 'ADMIN' && nonMembers.length > 0 && (
            <form onSubmit={handleAddMember} className="add-member-form">
              <div className="form-group" style={{ margin: '0' }}>
                <label className="form-label">Add Member</label>
                <select
                  className="form-select"
                  value={selectedInviteUser}
                  onChange={(e) => setSelectedInviteUser(e.target.value)}
                  required
                >
                  <option value="">Select a user...</option>
                  {nonMembers.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              {inviteError && <div className="auth-error" style={{ fontSize: '0.75rem', padding: '0.4rem' }}>{inviteError}</div>}

              <button type="submit" className="btn btn-primary" style={{ padding: '0.4rem', fontSize: '0.8rem' }} disabled={inviteSubmitting}>
                {inviteSubmitting ? 'Adding...' : 'Add Team Member'}
              </button>
            </form>
          )}
        </section>
      </div>

      {/* Task Creation & Edit Modal */}
      {showTaskModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <h2 style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, #fff, var(--accent-purple))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {editingTask ? 'Edit Task Details' : 'Create Project Task'}
            </h2>

            {taskError && <div className="auth-error" style={{ marginBottom: '1.25rem' }}>{taskError}</div>}

            <form onSubmit={handleTaskSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="taskTitle">Task Title</label>
                <input
                  className="form-input"
                  type="text"
                  id="taskTitle"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Task title..."
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="taskDesc">Description</label>
                <textarea
                  className="form-textarea"
                  id="taskDesc"
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  placeholder="Elaborate on details..."
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="taskStatus">Stage</label>
                  <select
                    className="form-select"
                    id="taskStatus"
                    value={taskStatus}
                    onChange={(e) => setTaskStatus(e.target.value)}
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="REVIEW">Review</option>
                    <option value="DONE">Completed</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="taskPriority">Priority</label>
                  <select
                    className="form-select"
                    id="taskPriority"
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="taskAssignee">Assignee</label>
                  <select
                    className="form-select"
                    id="taskAssignee"
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {project.members.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="taskDueDate">Due Date</label>
                  <input
                    className="form-input"
                    type="date"
                    id="taskDueDate"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowTaskModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={taskSubmitting}>
                  {taskSubmitting ? 'Saving...' : 'Save Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;
