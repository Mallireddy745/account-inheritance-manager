import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import axiosClient from '../../api/axiosClient';
import { formatApiError } from '../../utils/errorHandler';

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ fullName: '', phoneNumber: '', address: '', avatarUrl: '' });

  useEffect(() => {
    axiosClient.get('/users/profile')
      .then(res => {
        const p = res.data.data;
        setProfile(p);
        setForm({
          fullName: p.fullName || '',
          phoneNumber: p.phoneNumber || '',
          address: p.address || '',
          avatarUrl: p.avatarUrl || ''
        });
      })
      .catch(() => toast.error('Failed to load profile details'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await axiosClient.put('/users/profile', form);
      setProfile(res.data.data);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(formatApiError(err, 'Update failed'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center p-5">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-0 text-dark">My Profile</h4>
          <small className="text-muted">Manage your personal information and estate ownership identity</small>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-md-4">
          <div className="card shadow-sm border-0 text-center">
            <div className="card-body py-4">
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt="Avatar"
                  className="rounded-circle mb-3 border"
                  style={{ width: '90px', height: '90px', objectFit: 'cover' }}
                />
              ) : (
                <div
                  className="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center mb-3 shadow-sm"
                  style={{ width: '90px', height: '90px', fontSize: '2.5rem' }}
                >
                  <i className="bi bi-person-fill"></i>
                </div>
              )}
              <h5 className="fw-bold mb-1">{profile?.fullName || user?.email}</h5>
              <p className="text-muted small mb-2">{user?.email}</p>
              <div>
                <span className="badge bg-primary me-1">{profile?.role || user?.role}</span>
                <span className={`badge bg-${profile?.status === 'ACTIVE' ? 'success' : 'warning'}`}>
                  {profile?.status}
                </span>
              </div>
              <hr />
              <div className="text-start small text-muted">
                <div className="mb-1">
                  <strong>Phone:</strong> {profile?.phoneNumber || 'Not provided'}
                </div>
                <div className="mb-1">
                  <strong>Address:</strong> {profile?.address || 'Not provided'}
                </div>
                <div className="mb-1">
                  <strong>Registered:</strong> {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '-'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-8">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white fw-semibold border-0 pt-3">
              Edit Account Information
            </div>
            <div className="card-body">
              <form onSubmit={handleSave}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Email Address (Locked)</label>
                  <input className="form-control bg-light" value={user?.email || ''} disabled />
                  <div className="form-text">Primary authentication email cannot be altered directly.</div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Full Legal Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={form.fullName}
                    onChange={e => setForm({ ...form, fullName: e.target.value })}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Contact Phone Number</label>
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="e.g. +1 555-0199"
                    value={form.phoneNumber}
                    onChange={e => setForm({ ...form, phoneNumber: e.target.value })}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Residential / Primary Address</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    placeholder="Street, City, State, Country, Postal Code..."
                    value={form.address}
                    onChange={e => setForm({ ...form, address: e.target.value })}
                  ></textarea>
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold">Profile Avatar URL (Optional)</label>
                  <input
                    type="url"
                    className="form-control"
                    placeholder="https://example.com/avatar.jpg"
                    value={form.avatarUrl}
                    onChange={e => setForm({ ...form, avatarUrl: e.target.value })}
                  />
                </div>

                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? (
                    <><span className="spinner-border spinner-border-sm me-2"></span>Saving Changes...</>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
