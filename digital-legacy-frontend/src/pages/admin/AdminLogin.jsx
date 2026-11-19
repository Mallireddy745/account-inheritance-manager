import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { adminLogin } from '../../api/authService';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

export default function AdminLogin() {
  const { loginSuccess } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: 'admin@digitallegacy.com', password: 'Admin@123' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const fillDemoAdmin = () => {
    setForm({ email: 'admin@digitallegacy.com', password: 'Admin@123' });
    toast.info('Filled admin credentials');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await adminLogin(form);
      const authData = res.data.data;
      const token = authData.token;
      const user = {
        id: authData.userId,
        email: authData.email,
        fullName: authData.fullName,
        role: authData.role,
        status: authData.status,
      };

      if (user.role !== 'ADMIN' || user.email !== 'admin@digitallegacy.com') {
        setError('Access denied: Only admin@digitallegacy.com is authorized to access the Admin Portal.');
        setLoading(false);
        return;
      }

      loginSuccess(token, user);
      toast.success('Welcome Administrator');
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Admin authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#0f172a' }}>
      <div className="card shadow-lg border-0" style={{ width: '100%', maxWidth: '440px', backgroundColor: '#1e293b', color: '#f8fafc' }}>
        <div className="card-body p-4 p-md-5">
          <div className="text-center mb-4">
            <div className="d-inline-flex p-3 rounded-circle mb-3" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
              <i className="bi bi-shield-lock-fill" style={{ fontSize: '2.5rem' }}></i>
            </div>
            <h3 className="fw-bold mb-1" style={{ color: '#ffffff' }}>Admin Control Center</h3>
            <p className="text-muted small">Restricted Administrator Access</p>
          </div>

          {/* Quick Demo Helper Card */}
          <div className="p-2 px-3 rounded small mb-3 border border-secondary" style={{ backgroundColor: '#16213e' }}>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="fw-bold text-danger">
                <i className="bi bi-key-fill me-1"></i>Pre-seeded Admin Account:
              </span>
              <button
                type="button"
                className="btn btn-sm btn-danger py-0 px-2"
                style={{ fontSize: '0.75rem' }}
                onClick={fillDemoAdmin}
              >
                Auto-fill
              </button>
            </div>
            <div className="text-light"><strong>Email:</strong> <code>admin@digitallegacy.com</code></div>
            <div className="text-light"><strong>Password:</strong> <code>Admin@123</code></div>
          </div>
          
          {error && <div className="alert alert-danger py-2 small">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label text-light small fw-semibold">Admin Email</label>
              <div className="input-group">
                <span className="input-group-text bg-dark border-secondary text-secondary">
                  <i className="bi bi-envelope"></i>
                </span>
                <input
                  type="email"
                  name="email"
                  className="form-control bg-dark border-secondary text-light"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="admin@digitallegacy.com"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label text-light small fw-semibold">Password</label>
              <div className="input-group">
                <span className="input-group-text bg-dark border-secondary text-secondary">
                  <i className="bi bi-key"></i>
                </span>
                <input
                  type="password"
                  name="password"
                  className="form-control bg-dark border-secondary text-light"
                  value={form.password}
                  onChange={handleChange}
                  required
                  placeholder="Admin@12345"
                />
              </div>
            </div>

            <button type="submit" className="btn btn-danger w-100 py-2 fw-semibold" disabled={loading}>
              {loading ? (
                <><span className="spinner-border spinner-border-sm me-2"></span>Authenticating...</>
              ) : (
                <><i className="bi bi-box-arrow-in-right me-2"></i>Sign In as Admin</>
              )}
            </button>
          </form>

          <hr className="border-secondary my-4" />
          
          <div className="text-center">
            <Link to="/login" className="text-secondary small text-decoration-none">
              <i className="bi bi-arrow-left me-1"></i>Back to User Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
