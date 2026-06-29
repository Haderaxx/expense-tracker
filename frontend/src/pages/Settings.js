import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../utils/api';
import { CURRENCIES } from '../utils/format';
import toast from 'react-hot-toast';
import './Settings.css';

const Settings = () => {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', currency: user?.currency || 'USD', monthlyBudget: user?.monthlyBudget || '' });
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authAPI.updateProfile({ ...form, monthlyBudget: parseFloat(form.monthlyBudget) || 0 });
      updateUser(data);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally { setLoading(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <div className="page-subtitle">Manage your account preferences</div>
        </div>
      </div>

      <div className="settings-layout">
        <div className="card settings-card">
          <h3 className="settings-section-title">Profile</h3>
          <div className="profile-avatar-big">{user?.name?.[0]?.toUpperCase()}</div>
          <p className="text-muted text-sm" style={{ textAlign: 'center', marginBottom: 24 }}>{user?.email}</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label">Full Name</label>
              <input className="input-field" name="name" value={form.name} onChange={handleChange} placeholder="Your name" />
            </div>
            <div className="form-group">
              <label className="label">Currency</label>
              <select className="input-field" name="currency" value={form.currency} onChange={handleChange}>
                {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Monthly Budget</label>
              <input className="input-field" type="number" name="monthlyBudget" value={form.monthlyBudget} onChange={handleChange}
                placeholder="Set a monthly spending limit" min="0" step="0.01" />
              <span className="text-xs text-muted" style={{ marginTop: 6, display: 'block' }}>
                Used to track your budget on the dashboard
              </span>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? <span className="spinner" /> : 'Save Changes'}
            </button>
          </form>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <h3 className="settings-section-title">Account Info</h3>
            <div className="info-row">
              <span className="text-muted text-sm">Email</span>
              <span className="text-sm">{user?.email}</span>
            </div>
            <div className="info-row">
              <span className="text-muted text-sm">Member Since</span>
              <span className="text-sm">{new Date(user?.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
            </div>
            <div className="info-row">
              <span className="text-muted text-sm">Currency</span>
              <span className="text-sm">{user?.currency}</span>
            </div>
          </div>

          <div className="card" style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
            <h3 className="settings-section-title" style={{ color: 'var(--red)' }}>Data & Privacy</h3>
            <p className="text-sm text-muted" style={{ marginBottom: 16 }}>
              All your data is stored securely in your personal MongoDB database. Only you can access your transactions and financial data.
            </p>
            <div className="data-note">🔒 End-to-end encrypted · Your data stays yours</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
