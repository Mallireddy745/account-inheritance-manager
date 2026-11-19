import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../../api/authService';
import { toast } from 'react-toastify';
import { formatApiError } from '../../utils/errorHandler';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    role: 'OWNER',
    agreedToTerms: false
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleFillDemoOwner = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    setForm({
      fullName: `Estate Owner ${randomSuffix}`,
      email: `owner${randomSuffix}@example.com`,
      phoneNumber: '+1-555-0100',
      password: 'User@12345',
      confirmPassword: 'User@12345',
      role: 'OWNER',
      agreedToTerms: true
    });
    setErrors({});
  };

  const handleFillDemoBeneficiary = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    setForm({
      fullName: `Priya Heir ${randomSuffix}`,
      email: `priya${randomSuffix}@example.com`,
      phoneNumber: '+1-555-0188',
      password: 'User@12345',
      confirmPassword: 'User@12345',
      role: 'BENEFICIARY',
      agreedToTerms: true
    });
    setErrors({});
  };

  const validate = () => {
    const errs = {};
    const trimmedName = form.fullName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      errs.fullName = 'Full name must be at least 2 characters';
    }
    if (!form.email || !form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      errs.email = 'Valid email address is required';
    } else if (form.email.toLowerCase().endsWith('@digitallegacy.com')) {
      errs.email = 'The @digitallegacy.com domain is reserved for official administrators and verifiers. Please use your personal or business email.';
    }
    if (!form.password || form.password.length < 8) {
      errs.password = 'Password must be at least 8 characters long';
    } else if (!/(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])/.test(form.password)) {
      errs.password = 'Must contain at least 1 uppercase letter, 1 number, and 1 special symbol';
    }
    if (form.password !== form.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }
    if (!form.agreedToTerms) {
      errs.terms = 'You must agree to the Terms of Service';
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast.warning('Please review the form errors');
      return;
    }

    setLoading(true);
    setErrors({});
    try {
      await register({
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        phoneNumber: form.phoneNumber ? form.phoneNumber.trim() : null,
        password: form.password,
        confirmPassword: form.confirmPassword,
        role: form.role,
        termsConsent: Boolean(form.agreedToTerms),
        agreedToTerms: Boolean(form.agreedToTerms)
      });
      toast.success(
        form.role === 'BENEFICIARY'
          ? 'Beneficiary account created! You can now log in with your own credentials.'
          : 'Registration successful! Please log in.'
      );
      navigate('/login');
    } catch (err) {
      const errorMsg = formatApiError(err, 'Registration failed');
      setErrors({ general: errorMsg });
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-5">
      <div className="card shadow-lg border-0" style={{ width: '100%', maxWidth: '540px' }}>
        <div className="card-body p-4 p-md-5">
          <div className="text-center mb-4">
            <div className="d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 rounded-circle p-3 mb-2">
              <i className="bi bi-shield-lock-fill text-primary" style={{ fontSize: '2rem' }}></i>
            </div>
            <h3 className="fw-bold text-dark mb-1">Create Account</h3>
            <p className="text-muted small">Begin securing your digital estate or access nominated inheritances</p>
          </div>

          <div className="d-flex justify-content-end gap-2 mb-3">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={handleFillDemoOwner}
            >
              <i className="bi bi-person me-1"></i>Demo Owner
            </button>
            <button
              type="button"
              className="btn btn-outline-info btn-sm"
              onClick={handleFillDemoBeneficiary}
            >
              <i className="bi bi-gift me-1"></i>Demo Beneficiary
            </button>
          </div>

          {errors.general && (
            <div className="alert alert-danger d-flex align-items-center py-2" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
              <div className="small">{errors.general}</div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Account Type Selection */}
            <div className="mb-4">
              <label className="form-label fw-bold small text-muted text-uppercase mb-2">Account Role</label>
              <div className="row g-2">
                <div className="col-6">
                  <div
                    className={`p-3 border rounded text-center cursor-pointer transition ${
                      form.role === 'OWNER' ? 'border-primary bg-primary bg-opacity-10 text-primary fw-bold' : 'bg-white text-muted'
                    }`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setForm({ ...form, role: 'OWNER' })}
                  >
                    <i className="bi bi-person-badge fs-4 d-block mb-1"></i>
                    <div>Estate Owner</div>
                    <small className="fw-normal" style={{ fontSize: '0.75rem' }}>Manage my assets</small>
                  </div>
                </div>
                <div className="col-6">
                  <div
                    className={`p-3 border rounded text-center cursor-pointer transition ${
                      form.role === 'BENEFICIARY' ? 'border-info bg-info bg-opacity-10 text-dark fw-bold' : 'bg-white text-muted'
                    }`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setForm({ ...form, role: 'BENEFICIARY' })}
                  >
                    <i className="bi bi-gift-fill text-info fs-4 d-block mb-1"></i>
                    <div>Beneficiary</div>
                    <small className="fw-normal" style={{ fontSize: '0.75rem' }}>Access inheritances</small>
                  </div>
                </div>
              </div>
            </div>

            {form.role === 'BENEFICIARY' && (
              <div className="alert alert-info py-2 px-3 small mb-3 border-0 bg-info bg-opacity-10 text-info-emphasis">
                <i className="bi bi-shield-check me-2 fw-bold"></i>
                <strong>Independent Beneficiary Security:</strong> Register using your own email and password. You will <u>never</u> need the owner's password, and you will <u>never</u> log in to the owner's account.
              </div>
            )}

            <div className="mb-3">
              <label className="form-label fw-semibold small">Full Name *</label>
              <input
                type="text"
                name="fullName"
                className={`form-control ${errors.fullName ? 'is-invalid' : ''}`}
                value={form.fullName}
                onChange={handleChange}
                placeholder="e.g. Priya Sharma"
                required
              />
              {errors.fullName && <div className="invalid-feedback">{errors.fullName}</div>}
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold small">Email Address *</label>
              <input
                type="email"
                name="email"
                className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                value={form.email}
                onChange={handleChange}
                placeholder="name@example.com"
                required
              />
              {errors.email && <div className="invalid-feedback">{errors.email}</div>}
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold small">Phone Number (Optional)</label>
              <input
                type="tel"
                name="phoneNumber"
                className="form-control"
                value={form.phoneNumber}
                onChange={handleChange}
                placeholder="+1-555-0199"
              />
            </div>

            <div className="row g-2 mb-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold small">Password *</label>
                <input
                  type="password"
                  name="password"
                  className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Min 8 chars, 1 upper, 1 sym"
                  required
                />
                {errors.password && <div className="invalid-feedback">{errors.password}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold small">Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter password"
                  required
                />
                {errors.confirmPassword && <div className="invalid-feedback">{errors.confirmPassword}</div>}
              </div>
            </div>

            <div className="mb-4 form-check">
              <input
                type="checkbox"
                name="agreedToTerms"
                className={`form-check-input ${errors.terms ? 'is-invalid' : ''}`}
                id="terms"
                checked={form.agreedToTerms}
                onChange={handleChange}
              />
              <label className="form-check-label small text-muted" htmlFor="terms">
                I agree to the <span className="text-primary fw-semibold">Terms of Service</span> and <span className="text-primary fw-semibold">Privacy Policy</span>
              </label>
              {errors.terms && <div className="invalid-feedback">{errors.terms}</div>}
            </div>

            <button type="submit" className="btn btn-primary w-100 py-2 fw-semibold" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Creating Account...
                </>
              ) : (
                form.role === 'BENEFICIARY' ? 'Create Beneficiary Account' : 'Create Estate Owner Account'
              )}
            </button>
          </form>

          <hr className="my-4" />

          <p className="text-center text-muted small mb-0">
            Already have an account?{' '}
            <Link to="/login" className="text-primary fw-semibold text-decoration-none">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
