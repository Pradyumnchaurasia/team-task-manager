import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const { user, fetchWithAuth } = useAuth();
  const [projects, setProjects] = useState([]);
  const [detailedProjects, setDetailedProjects] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Project Modal State
  const [showModal, setShowModal] = useState(false);
  const [projName, setProjName] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [modalError, setModalError] = useState('');
  const [modalSubmitting, setModalSubmitting] = useState(false);

  // Search and Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // 1. Fetch short projects
      const projs = await fetchWithAuth('/api/projects').then(res => res.json());
      setProjects(projs);

      // 2. Fetch full details in parallel to gather all tasks and aggregate stats
      const details = await Promise.all(
        projs.map(p => 
          fetchWithAuth(`/api/projects/${p.id}`).then(res => res.json())
        )
      );
      setDetailedProjects(details);

      // 3. If Admin, fetch all users so they can be assigned to the project
      if (user.role === 'ADMIN') {
        const users = await fetchWithAuth('/api/users').then(res => res.json());
        setAllUsers(users);
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Compute Statistics
  const totalProjects = projects.length;
  
  // Extract all tasks across all projects
  const allTasks = detailedProjects.flatMap(proj => 
    proj.tasks.map(t => ({ ...t, projectName: proj.name, ownerId: proj.ownerId }))
  );

  const pendingTasks = allTasks.filter(t => t.status !== 'DONE').length;
  const completedTasks = allTasks.filter(t => t.status === 'DONE').length;

  const now = new Date();
  const overdueTasksList = allTasks.filter(t => {
    if (!t.dueDate || t.status === 'DONE') return false;
    return new Date(t.dueDate) < now;
  });
  const overdueCount = overdueTasksList.length;

  // Filter tasks assigned to current user
  const myTasks = allTasks.filter(t => t.assigneeId === user.id);

  // Quick Action: Mark task as Done
  const handleQuickComplete = async (taskId) => {
    try {
      const response = await fetchWithAuth(`/api/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'DONE' })
      });

      if (response.ok) {
        // Reload statistics
        loadDashboardData();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to complete task.');
      }
    } catch (err) {
      alert('Error updating task: ' + err.message);
    }
  };

  // Create Project Submission
  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!projName.trim()) {
      setModalError('Project name is required.');
      return;
    }

    setModalError('');
    setModalSubmitting(true);

    try {
      const response = await fetchWithAuth('/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: projName,
          description: projDesc,
          memberIds: selectedMembers
        })
      });

      const data = await response.json();

      if (response.ok) {
        setShowModal(false);
        setProjName('');
        setProjDesc('');
        setSelectedMembers([]);
        loadDashboardData();
      } else {
        setModalError(data.error || 'Failed to create project.');
      }
    } catch (err) {
      setModalError(err.message || 'Error creating project.');
    } finally {
      setModalSubmitting(false);
    }
  };

  // Toggle user selection for project members
  const handleToggleMember = (userId) => {
    if (selectedMembers.includes(userId)) {
      setSelectedMembers(selectedMembers.filter(id => id !== userId));
    } else {
      setSelectedMembers([...selectedMembers, userId]);
    }
  };

  // Filtered projects by search query
  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading && projects.length === 0) {
    return (
      <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <h2>Loading dashboard analytics...</h2>
      </div>
    );
  }

  return (
    <div className="main-content">
      {/* Greeting Header */}
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>Hello, {user.name}</h1>
          <p>Here's a breakdown of your team's project progression</p>
        </div>

        {user.role === 'ADMIN' && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <span>➕</span> Create Project
          </button>
        )}
      </div>

      {error && <div className="auth-error" style={{ marginBottom: '2rem' }}>{error}</div>}

      {/* Metrics Section */}
      <section className="metrics-grid">
        <div className="glass-panel metric-card">
          <div className="metric-icon" style={{ color: 'var(--accent-purple)' }}>📁</div>
          <div className="metric-details">
            <span className="metric-value">{totalProjects}</span>
            <span className="metric-label">Active Projects</span>
          </div>
        </div>

        <div className="glass-panel metric-card">
          <div className="metric-icon" style={{ color: 'var(--color-warning)' }}>⏳</div>
          <div className="metric-details">
            <span className="metric-value">{pendingTasks}</span>
            <span className="metric-label">Pending Tasks</span>
          </div>
        </div>

        <div className="glass-panel metric-card">
          <div className="metric-icon" style={{ color: 'var(--color-success)' }}>✅</div>
          <div className="metric-details">
            <span className="metric-value">{completedTasks}</span>
            <span className="metric-label">Completed Tasks</span>
          </div>
        </div>

        <div className="glass-panel metric-card" style={{ borderLeft: overdueCount > 0 ? '3px solid var(--color-danger)' : '' }}>
          <div className="metric-icon" style={{ color: 'var(--color-danger)' }}>⚠️</div>
          <div className="metric-details">
            <span className="metric-value" style={{ color: overdueCount > 0 ? 'var(--color-danger)' : '' }}>{overdueCount}</span>
            <span className="metric-label">Overdue Tasks</span>
          </div>
        </div>
      </section>

      {/* Core Lists */}
      <div className="content-grid">
        {/* Projects Listing */}
        <section className="glass-panel card">
          <div className="dashboard-section-title">
            <span>Projects Directory</span>
            <input 
              className="form-input" 
              type="text" 
              placeholder="Search projects..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ maxWidth: '200px', fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
            />
          </div>

          <div className="project-grid">
            {filteredProjects.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">📁</span>
                <p>No active projects found.</p>
              </div>
            ) : (
              filteredProjects.map(project => (
                <div key={project.id} className="glass-panel card project-card" style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.01)' }}>
                  <div className="project-card-header">
                    <Link to={`/project/${project.id}`} className="project-name">
                      {project.name}
                    </Link>
                    <span className="badge badge-todo" style={{ fontSize: '0.7rem' }}>
                      Owner: {project.owner.name.split(' ')[0]}
                    </span>
                  </div>
                  <p className="project-desc">{project.description || 'No description provided.'}</p>
                  
                  <div className="project-meta">
                    <div className="meta-item">
                      <span>📝</span> {project._count?.tasks || 0} Tasks
                    </div>
                    <div className="meta-item">
                      <span>👥</span> {project.members?.length || 0} Team members
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Actionable Tasks List */}
        <section className="glass-panel card">
          <div className="dashboard-section-title">
            <span>Urgent & Overdue Tasks</span>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ maxWidth: '140px', fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
            >
              <option value="ALL">All Urgent</option>
              <option value="OVERDUE">Overdue Only</option>
              <option value="MY_TASKS">Assigned to Me</option>
            </select>
          </div>

          <div className="task-list">
            {(() => {
              let displayTasks = [];
              if (statusFilter === 'ALL') {
                // Return high priority pending tasks + overdue tasks
                displayTasks = allTasks.filter(t => t.status !== 'DONE' && (t.priority === 'HIGH' || new Date(t.dueDate) < now));
              } else if (statusFilter === 'OVERDUE') {
                displayTasks = overdueTasksList;
              } else {
                displayTasks = myTasks.filter(t => t.status !== 'DONE');
              }

              if (displayTasks.length === 0) {
                return (
                  <div className="empty-state">
                    <span className="empty-icon">🎉</span>
                    <p>No high priority or overdue tasks to report.</p>
                  </div>
                );
              }

              return displayTasks.map(task => (
                <div key={task.id} className="task-item">
                  <div className="task-item-main">
                    <span className="task-project-name">{task.projectName}</span>
                    <span className="task-title">{task.title}</span>
                    {task.dueDate && (
                      <span className={`task-date ${new Date(task.dueDate) < now ? 'overdue' : ''}`}>
                        📅 Due: {new Date(task.dueDate).toLocaleDateString()} {new Date(task.dueDate) < now && '(OVERDUE)'}
                      </span>
                    )}
                  </div>

                  <div className="task-actions">
                    <span className={`badge ${
                      task.priority === 'HIGH' ? 'badge-high' : task.priority === 'MEDIUM' ? 'badge-medium' : 'badge-low'
                    }`} style={{ fontSize: '0.65rem' }}>
                      {task.priority}
                    </span>
                    <button 
                      className="btn btn-secondary btn-icon" 
                      onClick={() => handleQuickComplete(task.id)}
                      title="Mark as Complete"
                      style={{ width: '30px', height: '30px', fontSize: '0.8rem' }}
                    >
                      ✓
                    </button>
                  </div>
                </div>
              ));
            })()}
          </div>
        </section>
      </div>

      {/* Project Creator Modal (Admin only) */}
      {showModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <h2 style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, #fff, var(--accent-purple))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Create New Project
            </h2>

            {modalError && <div className="auth-error" style={{ marginBottom: '1.25rem' }}>{modalError}</div>}

            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <label className="form-label" htmlFor="projName">Project Name</label>
                <input
                  className="form-input"
                  type="text"
                  id="projName"
                  value={projName}
                  onChange={(e) => setProjName(e.target.value)}
                  placeholder="e.g. Acme Redesign"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="projDesc">Description</label>
                <textarea
                  className="form-textarea"
                  id="projDesc"
                  value={projDesc}
                  onChange={(e) => setProjDesc(e.target.value)}
                  placeholder="Summarize the core objectives..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Assign Team Members</label>
                <div style={{ maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                  {allUsers.filter(u => u.id !== user.id).map(u => (
                    <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(u.id)}
                        onChange={() => handleToggleMember(u.id)}
                        style={{ accentColor: 'var(--accent-purple)' }}
                      />
                      <span>{u.name} ({u.role})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={modalSubmitting}>
                  {modalSubmitting ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
