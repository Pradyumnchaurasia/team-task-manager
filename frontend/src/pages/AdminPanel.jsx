import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/AdminPanel.css';

const AdminPanel = () => {
  const { user, fetchWithAuth } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchWithAuth('/api/users').then(res => res.json());
      setUsers(data);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Failed to fetch system users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (targetUserId, newRole) => {
    setError('');
    setActionSuccess('');

    try {
      const response = await fetchWithAuth(`/api/users/${targetUserId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole })
      });

      const data = await response.json();

      if (response.ok) {
        setActionSuccess(`Successfully changed user role to ${newRole}!`);
        // Refresh users list
        loadUsers();
      } else {
        setError(data.error || 'Failed to update user role.');
      }
    } catch (err) {
      setError(err.message || 'Error updating role.');
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <h2>Loading admin directory...</h2>
      </div>
    );
  }

  // Calculate statistics
  const totalUsers = users.length;
  const totalAdmins = users.filter(u => u.role === 'ADMIN').length;
  const totalMembers = users.filter(u => u.role === 'MEMBER').length;

  return (
    <div className="main-content">
      {/* Title */}
      <div className="dashboard-header" style={{ marginBottom: '2rem' }}>
        <div className="dashboard-title">
          <h1>System Control Hub</h1>
          <p>Supervise user registration and role credentials</p>
        </div>
      </div>

      {error && <div className="auth-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}
      {actionSuccess && <div className="badge badge-done" style={{ display: 'block', padding: '0.75rem', marginBottom: '1.5rem', width: 'fit-content' }}>{actionSuccess}</div>}

      {/* Summary Cards */}
      <section className="admin-summary">
        <div className="glass-panel admin-summary-card">
          <span className="admin-summary-value" style={{ color: 'var(--text-primary)' }}>{totalUsers}</span>
          <span className="admin-summary-label">Total Accounts</span>
        </div>

        <div className="glass-panel admin-summary-card">
          <span className="admin-summary-value" style={{ color: 'var(--color-warning)' }}>{totalAdmins}</span>
          <span className="admin-summary-label">Administrators</span>
        </div>

        <div className="glass-panel admin-summary-card">
          <span className="admin-summary-value" style={{ color: 'var(--accent-purple)' }}>{totalMembers}</span>
          <span className="admin-summary-label">Team Members</span>
        </div>
      </section>

      {/* User Table Section */}
      <section className="glass-panel card" style={{ padding: '2rem' }}>
        <h3 className="dashboard-section-title" style={{ marginBottom: '1.5rem' }}>
          Registered Accounts Directory
        </h3>

        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Email Address</th>
                <th>Date Joined</th>
                <th>System Role Badge</th>
                <th>Modify Privileges</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>
                    <span className="table-user-name">{u.name}</span>
                    {u.id === user.id && <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', padding: '0.15rem 0.35rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>(You)</span>}
                  </td>
                  <td>{u.email}</td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge ${u.role === 'ADMIN' ? 'badge-in-progress' : 'badge-todo'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    <select
                      className="role-select"
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      disabled={u.id === user.id} // Cannot edit own role to prevent lockout
                    >
                      <option value="MEMBER">MEMBER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AdminPanel;
