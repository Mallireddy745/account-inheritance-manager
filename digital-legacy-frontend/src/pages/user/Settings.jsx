import React, { useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { toast } from 'react-toastify';
import { formatApiError } from '../../utils/errorHandler';

export default function Settings() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.currentPassword) {
      errs.currentPassword = 'Current password is required';
    }
    if (!form.newPassword || form.newPassword.length < 8) {
      errs.newPassword = 'New password must be at least 8 characters long';
    } else if (!/(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])/.test(form.newPassword)) {
      errs.newPassword = 'Must contain at least 1 uppercase letter, 1 number, and 1 special symbol';
    }
    if (form.newPassword === form.currentPassword) {
      errs.newPassword = 'New password cannot be the same as your current password';
    }
    if (form.newPassword !== form.confirmPassword) {
      errs.confirmPassword = 'New password and confirmation do not match';
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast.warning('Please correct the password form errors');
      return;
    }

    setLoading(true);
    setErrors({});
    try {
      await axiosClient.put('/users/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
        confirmNewPassword: form.confirmPassword,
        confirmPassword: form.confirmPassword
      });
      toast.success('Password updated successfully! Please use your new password for all future logins.');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(formatApiError(err, 'Password change failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-0 text-dark">
            <i className="bi bi-shield-lock me-2 text-primary"></i>
            Security Settings
          </h4>
          <small className="text-muted">Manage your authentication credentials and account security</small>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-6 col-md-8">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold text-dark">
                <i className="bi bi-key-fill text-warning me-2"></i>
                Change Password
              </h5>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setShowPasswords(!showPasswords)}
              >
                <i className={`bi ${showPasswords ? 'bi-eye-slash' : 'bi-eye'} me-1`}></i>
                {showPasswords ? 'Hide' : 'Show'}
              </button>
            </div>
            <div className="card-body p-4">
              <div className="alert alert-light border small mb-4">
                <i className="bi bi-info-circle-fill text-primary me-2"></i>
                Once updated, your current password will be permanently replaced. All subsequent logins across any portal will strictly authenticate against your newly assigned password.
              </div>

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-semibold small">Current Password *</label>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    className={`form-control ${errors.currentPassword ? 'is-invalid' : ''}`}
                    required
                    placeholder="Enter current password"
                    value={form.currentPassword}
                    onChange={e => setForm({ ...form, currentPassword: e.target.value })}
                  />
                  {errors.currentPassword && <div className="invalid-feedback">{errors.currentPassword}</div>}
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold small">New Password *</label>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    className={`form-control ${errors.newPassword ? 'is-invalid' : ''}`}
                    required
                    placeholder="Min 8 chars, 1 upper, 1 num, 1 sym"
                    value={form.newPassword}
                    onChange={e => setForm({ ...form, newPassword: e.target.value })}
                  />
                  {errors.newPassword && <div className="invalid-feedback">{errors.newPassword}</div>}
                  <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                    Must be at least 8 characters with uppercase, numeric, and symbol characters.
                  </small>
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold small">Confirm New Password *</label>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                    required
                    placeholder="Re-enter new password"
                    value={form.confirmPassword}
                    onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                  />
                  {errors.confirmPassword && <div className="invalid-feedback">{errors.confirmPassword}</div>}
                </div>

                <button type="submit" className="btn btn-primary w-100 py-2 fw-semibold" disabled={loading}>
                  {loading ? (
                    <><span className="spinner-border spinner-border-sm me-2"></span>Updating Password...</>
                  ) : (
                    <><i className="bi bi-check-circle me-1"></i>Update Password</>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-6 col-md-4">
          <div className="card shadow-sm border-0 bg-light h-100">
            <div className="card-body p-4">
              <h6 className="fw-bold text-dark mb-3">
                <i className="bi bi-shield-check text-success me-2"></i>
                Password Security Guidelines
              </h6>
              <ul className="list-unstyled small text-muted d-flex flex-column gap-2 mb-0">
                <li className="d-flex align-items-start">
                  <i className="bi bi-check2 text-success me-2 mt-1"></i>
                  <span>Minimum 8 characters (longer is stronger)</span>
                </li>
                <li className="d-flex align-items-start">
                  <i className="bi bi-check2 text-success me-2 mt-1"></i>
                  <span>At least one uppercase letter (A-Z)</span>
                </li>
                <li className="d-flex align-items-start">
                  <i className="bi bi-check2 text-success me-2 mt-1"></i>
                  <span>At least one number (0-9)</span>
                </li>
                <li className="d-flex align-items-start">
                  <i className="bi bi-check2 text-success me-2 mt-1"></i>
                  <span>At least one special character (!@#$%^&amp;* etc.)</span>
                </li>
                <li className="d-flex align-items-start">
                  <i className="bi bi-check2 text-success me-2 mt-1"></i>
                  <span>Encrypted and hashed securely using BCrypt</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
