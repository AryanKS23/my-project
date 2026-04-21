import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Activity, BarChart3, Shield, User, Ban, Trash2, CheckCircle } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    
    if (!token || userData.role !== 'admin') {
      navigate('/login');
      return;
    }
    
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    const token = localStorage.getItem('auth_token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    try {
      const [statsRes, usersRes] = await Promise.all([
        axios.get(`${API}/admin/stats`, config),
        axios.get(`${API}/admin/users`, config)
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async (userId) => {
    const token = localStorage.getItem('auth_token');
    try {
      await axios.post(`${API}/admin/users/${userId}/block`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (error) {
      alert('Failed to block user');
    }
  };

  const handleUnblockUser = async (userId) => {
    const token = localStorage.getItem('auth_token');
    try {
      await axios.post(`${API}/admin/users/${userId}/unblock`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (error) {
      alert('Failed to unblock user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    const token = localStorage.getItem('auth_token');
    try {
      await axios.delete(`${API}/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (error) {
      alert('Failed to delete user');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F5F2EA] via-[#E8EFE6] to-[#F5F2EA] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F2EA] via-[#E8EFE6] to-[#F5F2EA]">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary" />
              <h1 className="text-xl font-bold text-primary">Admin Dashboard</h1>
            </div>
            <button onClick={handleLogout} className="btn-secondary text-sm">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {stats && (
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div data-testid="stat-total-users" className="card">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-3xl font-bold text-primary">{stats.total_users}</p>
                </div>
              </div>
            </div>

            <div data-testid="stat-verified-users" className="card">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Verified</p>
                  <p className="text-3xl font-bold text-primary">{stats.verified_users}</p>
                </div>
              </div>
            </div>

            <div data-testid="stat-analyses" className="card">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Analyses</p>
                  <p className="text-3xl font-bold text-primary">{stats.total_symptom_analyses}</p>
                </div>
              </div>
            </div>

            <div data-testid="stat-doctors" className="card">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Doctors</p>
                  <p className="text-3xl font-bold text-primary">{stats.total_doctors}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="card">
          <h2 className="text-2xl font-semibold text-primary mb-6">User Management</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-primary">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-primary">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-primary">Role</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-primary">Status</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-primary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} data-testid={`user-row-${user.id}`} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{user.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{user.email}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        {user.is_verified && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            Verified
                          </span>
                        )}
                        {user.is_blocked && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            Blocked
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {user.role !== 'admin' && (
                        <div className="flex justify-end gap-2">
                          {user.is_blocked ? (
                            <button
                              data-testid={`unblock-${user.id}`}
                              onClick={() => handleUnblockUser(user.id)}
                              className="p-2 hover:bg-green-50 rounded-lg transition-colors"
                              title="Unblock user"
                            >
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            </button>
                          ) : (
                            <button
                              data-testid={`block-${user.id}`}
                              onClick={() => handleBlockUser(user.id)}
                              className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                              title="Block user"
                            >
                              <Ban className="w-4 h-4 text-red-600" />
                            </button>
                          )}
                          <button
                            data-testid={`delete-${user.id}`}
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete user"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}