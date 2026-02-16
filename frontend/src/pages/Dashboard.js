import React, { useState, useEffect } from 'react';
import { Activity, Pill, Calendar, User, PlusCircle } from 'lucide-react';
import Navigation from '@/components/Navigation';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Dashboard() {
  const [userId, setUserId] = useState(localStorage.getItem('healthadvisor_user_id') || '');
  const [user, setUser] = useState(null);
  const [healthRecords, setHealthRecords] = useState([]);
  const [showCreateUser, setShowCreateUser] = useState(!userId);
  const [newUser, setNewUser] = useState({ name: '', email: '', age: '' });
  const [newRecord, setNewRecord] = useState({
    symptoms: '',
    conditions: '',
    medicines: '',
    notes: ''
  });
  const [showAddRecord, setShowAddRecord] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchUserData();
      fetchHealthRecords();
    }
  }, [userId]);

  const fetchUserData = async () => {
    try {
      const response = await axios.get(`${API}/users/${userId}`);
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const fetchHealthRecords = async () => {
    try {
      const response = await axios.get(`${API}/health-records/${userId}`);
      setHealthRecords(response.data);
    } catch (error) {
      console.error('Error fetching health records:', error);
    }
  };

  const createUser = async () => {
    try {
      const response = await axios.post(`${API}/users`, {
        name: newUser.name,
        email: newUser.email,
        age: parseInt(newUser.age) || null
      });
      const createdUserId = response.data.id;
      setUserId(createdUserId);
      localStorage.setItem('healthadvisor_user_id', createdUserId);
      setShowCreateUser(false);
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Failed to create profile');
    }
  };

  const addHealthRecord = async () => {
    try {
      await axios.post(`${API}/health-records`, {
        user_id: userId,
        symptoms: newRecord.symptoms,
        conditions: newRecord.conditions.split(',').map(c => c.trim()),
        medicines: newRecord.medicines.split(',').map(m => m.trim()),
        notes: newRecord.notes
      });
      setShowAddRecord(false);
      setNewRecord({ symptoms: '', conditions: '', medicines: '', notes: '' });
      fetchHealthRecords();
    } catch (error) {
      console.error('Error adding health record:', error);
      alert('Failed to add record');
    }
  };

  if (showCreateUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F5F2EA] via-[#E8EFE6] to-[#F5F2EA]">
        <Navigation />
        <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <div className="card">
              <h2 className="text-3xl font-semibold text-primary mb-6">Create Your Profile</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">Name</label>
                  <input
                    data-testid="create-user-name-input"
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="input-field"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">Email</label>
                  <input
                    data-testid="create-user-email-input"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="input-field"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">Age (Optional)</label>
                  <input
                    data-testid="create-user-age-input"
                    type="number"
                    value={newUser.age}
                    onChange={(e) => setNewUser({ ...newUser, age: e.target.value })}
                    className="input-field"
                    placeholder="Your age"
                  />
                </div>
                <button
                  data-testid="create-profile-btn"
                  onClick={createUser}
                  disabled={!newUser.name || !newUser.email}
                  className="btn-primary w-full disabled:opacity-50"
                >
                  Create Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F2EA] via-[#E8EFE6] to-[#F5F2EA]">
      <Navigation />
      
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-primary mb-4">
              Health Dashboard
            </h1>
            <p className="text-base leading-relaxed text-muted-foreground">
              Track your health journey and manage your records
            </p>
          </div>

          {user && (
            <div data-testid="user-profile-section" className="card mb-8">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-medium text-primary mb-1">{user.name}</h2>
                  <p className="text-sm text-muted-foreground mb-2">{user.email}</p>
                  {user.age && (
                    <p className="text-sm text-muted-foreground">Age: {user.age}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            <div data-testid="stats-total-records" className="card">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Records</p>
                  <p className="text-3xl font-bold text-primary">{healthRecords.length}</p>
                </div>
              </div>
            </div>

            <div data-testid="stats-recent-visits" className="card">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Recent Visits</p>
                  <p className="text-3xl font-bold text-primary">
                    {healthRecords.filter(r => r.doctor_visit).length}
                  </p>
                </div>
              </div>
            </div>

            <div data-testid="stats-medications" className="card">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Pill className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Medications Tracked</p>
                  <p className="text-3xl font-bold text-primary">
                    {healthRecords.reduce((acc, r) => acc + r.medicines.length, 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-medium text-primary">Health Records</h2>
              <button
                data-testid="add-record-btn"
                onClick={() => setShowAddRecord(!showAddRecord)}
                className="btn-primary flex items-center gap-2"
              >
                <PlusCircle className="w-5 h-5" />
                Add Record
              </button>
            </div>

            {showAddRecord && (
              <div data-testid="add-record-form" className="mb-6 p-6 bg-gray-50 rounded-xl">
                <h3 className="text-lg font-medium text-primary mb-4">New Health Record</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">Symptoms</label>
                    <input
                      data-testid="record-symptoms-input"
                      type="text"
                      value={newRecord.symptoms}
                      onChange={(e) => setNewRecord({ ...newRecord, symptoms: e.target.value })}
                      className="input-field"
                      placeholder="e.g., fever, headache"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">Conditions (comma-separated)</label>
                    <input
                      data-testid="record-conditions-input"
                      type="text"
                      value={newRecord.conditions}
                      onChange={(e) => setNewRecord({ ...newRecord, conditions: e.target.value })}
                      className="input-field"
                      placeholder="e.g., Common cold, Viral infection"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">Medicines (comma-separated)</label>
                    <input
                      data-testid="record-medicines-input"
                      type="text"
                      value={newRecord.medicines}
                      onChange={(e) => setNewRecord({ ...newRecord, medicines: e.target.value })}
                      className="input-field"
                      placeholder="e.g., Paracetamol, Vitamin C"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">Notes</label>
                    <textarea
                      data-testid="record-notes-input"
                      value={newRecord.notes}
                      onChange={(e) => setNewRecord({ ...newRecord, notes: e.target.value })}
                      className="input-field resize-none"
                      rows={3}
                      placeholder="Additional notes..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      data-testid="save-record-btn"
                      onClick={addHealthRecord}
                      disabled={!newRecord.symptoms}
                      className="btn-primary disabled:opacity-50"
                    >
                      Save Record
                    </button>
                    <button
                      data-testid="cancel-record-btn"
                      onClick={() => setShowAddRecord(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {healthRecords.length > 0 ? (
              <div className="space-y-4">
                {healthRecords.map((record, idx) => (
                  <div
                    key={record.id}
                    data-testid={`health-record-${idx}`}
                    className="p-6 bg-gray-50 rounded-xl"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-primary mb-1">Symptoms: {record.symptoms}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(record.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-primary mb-1">Conditions:</p>
                        <div className="flex flex-wrap gap-2">
                          {record.conditions.map((condition, i) => (
                            <span key={i} className="px-3 py-1 bg-white rounded-full text-sm text-muted-foreground">
                              {condition}
                            </span>
                          ))}
                        </div>
                      </div>

                      {record.medicines.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-primary mb-1">Medicines:</p>
                          <div className="flex flex-wrap gap-2">
                            {record.medicines.map((medicine, i) => (
                              <span key={i} className="px-3 py-1 bg-white rounded-full text-sm text-muted-foreground">
                                {medicine}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {record.notes && (
                        <div>
                          <p className="text-sm font-medium text-primary mb-1">Notes:</p>
                          <p className="text-sm text-muted-foreground">{record.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Activity className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">No health records yet. Add your first record to start tracking!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}