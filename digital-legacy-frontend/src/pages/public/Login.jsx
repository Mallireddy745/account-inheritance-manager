import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../../api/authService';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { formatApiError } from '../../utils/errorHandler';

export default function Login() {
  const { loginSuccess } = useAuth();
  const navigate = useNavigate();

  // Authentication State
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Mobile Navbar Toggle State
  const [navCollapsed, setNavCollapsed] = useState(true);

  // Contact Form State
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    inquiryType: 'General Inquiry',
    message: ''
  });
  const [contactSubmitting, setContactSubmitting] = useState(false);

  // Handle Authentication Input
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Smooth Scroll Helper
  const scrollToSection = (sectionId) => {
    setNavCollapsed(true);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Authentication Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await login(form);
      const authData = res.data.data;
      const token = authData.token;
      const user = {
        id: authData.userId,
        email: authData.email,
        fullName: authData.fullName,
        role: authData.role,
        status: authData.status,
        isBeneficiary: authData.isBeneficiary,
        inheritedAssetsCount: authData.inheritedAssetsCount
      };
      loginSuccess(token, user);
      toast.success('Welcome back, ' + (user.fullName || user.email));

      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (user.role === 'BENEFICIARY') {
        navigate('/user/inherited-assets');
      } else if (user.role === 'VERIFIER') {
        navigate('/verifier/requests');
      } else {
        navigate('/user/dashboard');
      }
    } catch (err) {
      setError(formatApiError(err, 'Login failed. Please check your credentials.'));
    } finally {
      setLoading(false);
    }
  };

  // Contact Form Submission
  const handleContactSubmit = (e) => {
    e.preventDefault();
    setContactSubmitting(true);
    setTimeout(() => {
      setContactSubmitting(false);
      toast.success('Thank you! Your message has been received. Our team will contact you shortly.');
      setContactForm({
        name: '',
        email: '',
        inquiryType: 'General Inquiry',
        message: ''
      });
    }, 700);
  };

  return (
    <div className="bg-light" style={{ minHeight: '100vh', scrollBehavior: 'smooth' }}>
      {/* ──────────────────────────────────────────────────────────────────────────
          1. NAVIGATION BAR
      ────────────────────────────────────────────────────────────────────────── */}
      <nav className="navbar navbar-expand-lg navbar-dark fixed-top landing-nav py-3 shadow-sm">
        <div className="container">
          <button
            onClick={() => scrollToSection('home')}
            className="navbar-brand d-flex align-items-center text-white fw-bold border-0 bg-transparent p-0"
            style={{ cursor: 'pointer' }}
          >
            <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-2" style={{ width: '38px', height: '38px' }}>
              <i className="bi bi-shield-lock-fill fs-5"></i>
            </div>
            <span>Account Inheritance Manager</span>
          </button>

          {/* Hamburger Menu Toggle */}
          <button
            className="navbar-toggler border-0"
            type="button"
            onClick={() => setNavCollapsed(!navCollapsed)}
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          {/* Nav Links */}
          <div className={`collapse navbar-collapse ${!navCollapsed ? 'show' : ''}`}>
            <ul className="navbar-nav ms-auto mb-2 mb-lg-0 align-items-lg-center gap-lg-1">
              <li className="nav-item">
                <button
                  type="button"
                  className="nav-link landing-nav-link border-0 bg-transparent"
                  onClick={() => scrollToSection('home')}
                >
                  <i className="bi bi-house-door me-1"></i>Home
                </button>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  className="nav-link landing-nav-link border-0 bg-transparent"
                  onClick={() => scrollToSection('how-it-works')}
                >
                  <i className="bi bi-diagram-3 me-1"></i>How It Works
                </button>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  className="nav-link landing-nav-link border-0 bg-transparent"
                  onClick={() => scrollToSection('contact')}
                >
                  <i className="bi bi-envelope me-1"></i>Contact
                </button>
              </li>
              <li className="nav-item ms-lg-2 mt-2 mt-lg-0">
                <button
                  type="button"
                  className="btn btn-outline-light btn-sm px-3 py-2 fw-semibold rounded-pill"
                  onClick={() => scrollToSection('login')}
                >
                  <i className="bi bi-box-arrow-in-right me-1"></i>Login
                </button>
              </li>
              <li className="nav-item ms-lg-2 mt-2 mt-lg-0">
                <Link
                  to="/register"
                  className="btn btn-primary btn-sm px-3 py-2 fw-semibold rounded-pill text-white shadow-sm"
                >
                  <i className="bi bi-person-plus me-1"></i>Register
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* ──────────────────────────────────────────────────────────────────────────
          2. HOME (HERO SECTION)
      ────────────────────────────────────────────────────────────────────────── */}
      <section id="home" className="hero-gradient pt-5 pb-5 position-relative" style={{ minHeight: '90vh', paddingTop: '100px' }}>
        <div className="container py-5 mt-5">
          <div className="row align-items-center g-5">
            <div className="col-lg-7">
              <div className="d-inline-flex align-items-center bg-white bg-opacity-10 border border-white border-opacity-25 rounded-pill px-3 py-1 mb-3">
                <i className="bi bi-shield-check text-info me-2 fs-5"></i>
                <span className="small text-light fw-medium">Next-Gen Digital Estate & Account Succession</span>
              </div>

              <h1 className="display-4 fw-extrabold text-white mb-3" style={{ lineHeight: '1.2' }}>
                Secure Today. Inherit Tomorrow. <br />
                <span style={{ color: '#60a5fa' }}>Zero Hassle.</span>
              </h1>

              <p className="lead text-light text-opacity-75 mb-4" style={{ maxWidth: '600px' }}>
                <strong>Account Inheritance Manager</strong> guarantees that your financial accounts, crypto wallets,
                cloud vaults, emails, and sensitive documents pass safely to designated heirs when life takes an unexpected turn.
                Engineered with <strong>AES-256-GCM authenticated encryption</strong> and multi-tier verification workflows.
              </p>

              <div className="d-flex flex-wrap gap-3 mb-5">
                <button
                  type="button"
                  className="btn btn-primary btn-lg px-4 py-3 fw-bold rounded-pill shadow"
                  onClick={() => scrollToSection('login')}
                >
                  <i className="bi bi-box-arrow-in-right me-2"></i>Sign In to Portal
                </button>
                <button
                  type="button"
                  className="btn btn-outline-light btn-lg px-4 py-3 fw-semibold rounded-pill"
                  onClick={() => scrollToSection('how-it-works')}
                >
                  <i className="bi bi-play-circle me-2"></i>Explore How It Works
                </button>
              </div>

              {/* Trust Metric Badges */}
              <div className="row g-3 pt-3 border-top border-white border-opacity-10 text-light text-opacity-90">
                <div className="col-6 col-sm-3">
                  <div className="fw-bold fs-5 text-info">AES-256-GCM</div>
                  <small className="text-light text-opacity-75">Vault Encryption</small>
                </div>
                <div className="col-6 col-sm-3">
                  <div className="fw-bold fs-5 text-warning">Zero-Trust</div>
                  <small className="text-light text-opacity-75">IDOR Isolation</small>
                </div>
                <div className="col-6 col-sm-3">
                  <div className="fw-bold fs-5 text-success">Verified Heirs</div>
                  <small className="text-light text-opacity-75">Multi-Tier Claims</small>
                </div>
                <div className="col-6 col-sm-3">
                  <div className="fw-bold fs-5 text-primary-subtle">Audit Trail</div>
                  <small className="text-light text-opacity-75">Immutable Logs</small>
                </div>
              </div>
            </div>

            {/* Hero Interactive Visual / Card */}
            <div className="col-lg-5">
              <div className="card border-0 shadow-lg bg-dark text-white p-4 rounded-4" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="d-flex align-items-center justify-content-between pb-3 mb-3 border-bottom border-secondary">
                  <div className="d-flex align-items-center">
                    <div className="bg-primary bg-opacity-25 p-2 rounded-3 text-primary me-2">
                      <i className="bi bi-shield-shaded fs-4"></i>
                    </div>
                    <div>
                      <h6 className="mb-0 fw-bold text-white">Live Vault Status</h6>
                      <small className="text-success"><i className="bi bi-circle-fill me-1" style={{ fontSize: '0.5rem' }}></i>Security Active</small>
                    </div>
                  </div>
                  <span className="badge bg-primary bg-opacity-20 text-info border border-info border-opacity-25 px-2 py-1">Bank-Grade</span>
                </div>

                {/* Account Mock List */}
                <div className="vstack gap-2 mb-3">
                  <div className="d-flex align-items-center justify-content-between p-2 rounded bg-secondary bg-opacity-25">
                    <div className="d-flex align-items-center">
                      <i className="bi bi-currency-bitcoin text-warning fs-5 me-2"></i>
                      <div>
                        <div className="small fw-semibold">Crypto Cold Wallet & Keys</div>
                        <small className="text-muted">Release: Inactivity + Medical Proof</small>
                      </div>
                    </div>
                    <span className="badge bg-success-subtle text-success">Secured</span>
                  </div>

                  <div className="d-flex align-items-center justify-content-between p-2 rounded bg-secondary bg-opacity-25">
                    <div className="d-flex align-items-center">
                      <i className="bi bi-bank2 text-info fs-5 me-2"></i>
                      <div>
                        <div className="small fw-semibold">Primary Banking & Investment</div>
                        <small className="text-muted">Release: Heir Claim Approved</small>
                      </div>
                    </div>
                    <span className="badge bg-success-subtle text-success">Secured</span>
                  </div>

                  <div className="d-flex align-items-center justify-content-between p-2 rounded bg-secondary bg-opacity-25">
                    <div className="d-flex align-items-center">
                      <i className="bi bi-cloud-arrow-up text-primary fs-5 me-2"></i>
                      <div>
                        <div className="small fw-semibold">Cloud Documents & Vault</div>
                        <small className="text-muted">Release: Direct Heir Transfer</small>
                      </div>
                    </div>
                    <span className="badge bg-success-subtle text-success">Secured</span>
                  </div>
                </div>

                <div className="p-3 rounded-3 bg-primary bg-opacity-10 border border-primary border-opacity-25">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <small className="text-muted d-block">Authorized Beneficiary</small>
                      <strong className="text-light small">Sarah Jenkins (Daughter)</strong>
                    </div>
                    <span className="badge bg-primary">Full Transfer Access</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          3. HOW IT WORKS SECTION
      ────────────────────────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-5 bg-white border-top border-bottom">
        <div className="container py-4">
          <div className="text-center mb-5">
            <span className="badge bg-primary-subtle text-primary fw-bold px-3 py-2 rounded-pill mb-2">
              <i className="bi bi-gear-wide-connected me-1"></i>Seamless Succession Protocol
            </span>
            <h2 className="fw-bold text-dark display-6">How Account Inheritance Works</h2>
            <p className="text-muted mx-auto" style={{ maxWidth: '650px' }}>
              Protecting your life's digital assets shouldn't be complicated. Our structured 4-step framework
              gives you total autonomy during your lifetime and guarantees seamless succession to your loved ones.
            </p>
          </div>

          <div className="row g-4">
            {/* Step 1 */}
            <div className="col-md-6 col-lg-3">
              <div className="card h-100 border-0 shadow-sm p-4 feature-step-card text-center bg-light">
                <div className="mx-auto mb-3 rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                  <i className="bi bi-safe fs-3"></i>
                </div>
                <span className="badge bg-primary text-white mb-2 mx-auto">Step 01</span>
                <h5 className="fw-bold mb-2">Catalog Accounts</h5>
                <p className="text-muted small mb-0">
                  Securely log financial logins, cryptocurrency seed phrases, email portals, and cloud drives. All sensitive values are shielded with AES-256-GCM.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="col-md-6 col-lg-3">
              <div className="card h-100 border-0 shadow-sm p-4 feature-step-card text-center bg-light">
                <div className="mx-auto mb-3 rounded-circle bg-success text-white d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                  <i className="bi bi-people-fill fs-3"></i>
                </div>
                <span className="badge bg-success text-white mb-2 mx-auto">Step 02</span>
                <h5 className="fw-bold mb-2">Appoint Beneficiaries</h5>
                <p className="text-muted small mb-0">
                  Designate trusted family members, business partners, or legal counsel. Specify granular access rights such as VIEW, DOWNLOAD, or TRANSFER.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="col-md-6 col-lg-3">
              <div className="card h-100 border-0 shadow-sm p-4 feature-step-card text-center bg-light">
                <div className="mx-auto mb-3 rounded-circle bg-warning text-dark d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                  <i className="bi bi-hourglass-split fs-3"></i>
                </div>
                <span className="badge bg-warning text-dark mb-2 mx-auto">Step 03</span>
                <h5 className="fw-bold mb-2">Set Smart Triggers</h5>
                <p className="text-muted small mb-0">
                  Configure inactivity pings, emergency access claims, or verified life event handovers. Nothing releases without satisfying strict safety thresholds.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="col-md-6 col-lg-3">
              <div className="card h-100 border-0 shadow-sm p-4 feature-step-card text-center bg-light">
                <div className="mx-auto mb-3 rounded-circle bg-info text-white d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                  <i className="bi bi-patch-check-fill fs-3"></i>
                </div>
                <span className="badge bg-info text-white mb-2 mx-auto">Step 04</span>
                <h5 className="fw-bold mb-2">Verified Handover</h5>
                <p className="text-muted small mb-0">
                  Upon verified event confirmation by licensed verifiers, heirs gain direct access through their isolated portal with complete audit transparency.
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Feature Highlights Showcase */}
          <div className="row g-4 mt-4 align-items-center">
            <div className="col-lg-6">
              <div className="card border-0 shadow-sm p-4 bg-light rounded-4">
                <h4 className="fw-bold text-dark mb-3">
                  <i className="bi bi-shield-shaded text-primary me-2"></i>Built with Uncompromising Security
                </h4>
                <div className="vstack gap-3">
                  <div className="d-flex align-items-start">
                    <i className="bi bi-check-circle-fill text-success fs-5 me-3 mt-1"></i>
                    <div>
                      <h6 className="fw-semibold mb-1">Authenticated AES-256-GCM Encryption</h6>
                      <small className="text-muted">Master secrets, account credentials, and recovery codes are encrypted in-memory and at-rest with authenticated Galois/Counter Mode.</small>
                    </div>
                  </div>
                  <div className="d-flex align-items-start">
                    <i className="bi bi-check-circle-fill text-success fs-5 me-3 mt-1"></i>
                    <div>
                      <h6 className="fw-semibold mb-1">Zero-Trust IDOR Mitigation</h6>
                      <small className="text-muted">Strict server-side validation guarantees that users and beneficiaries can never access records outside their cryptographically verified scope.</small>
                    </div>
                  </div>
                  <div className="d-flex align-items-start">
                    <i className="bi bi-check-circle-fill text-success fs-5 me-3 mt-1"></i>
                    <div>
                      <h6 className="fw-semibold mb-1">Independent Licensed Verifiers</h6>
                      <small className="text-muted">Emergency inheritance requests are vetted by third-party legal or medical verifiers before any sensitive assets are made visible.</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="card border-0 shadow-sm p-4 bg-light rounded-4">
                <h4 className="fw-bold text-dark mb-3">
                  <i className="bi bi-person-lines-fill text-primary me-2"></i>Multi-Role Access Architecture
                </h4>
                <div className="row g-3">
                  <div className="col-sm-6">
                    <div className="p-3 bg-white rounded-3 border">
                      <div className="fw-bold text-primary mb-1">
                        <i className="bi bi-person-badge me-1"></i>Estate Owner
                      </div>
                      <small className="text-muted">Catalog accounts, assign heirs, manage permissions, and maintain complete ownership.</small>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="p-3 bg-white rounded-3 border">
                      <div className="fw-bold text-success mb-1">
                        <i className="bi bi-gift me-1"></i>Beneficiary
                      </div>
                      <small className="text-muted">Receive transferred accounts, claim emergency access, and download designated records.</small>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="p-3 bg-white rounded-3 border">
                      <div className="fw-bold text-warning mb-1">
                        <i className="bi bi-patch-check me-1"></i>Licensed Verifier
                      </div>
                      <small className="text-muted">Independently inspect emergency documents and approve legitimate inheritance transitions.</small>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="p-3 bg-white rounded-3 border">
                      <div className="fw-bold text-danger mb-1">
                        <i className="bi bi-shield-lock me-1"></i>System Admin
                      </div>
                      <small className="text-muted">Monitor global platform health, user provisioning, and immutable security audit trails.</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          4. LOGIN SECTION
      ────────────────────────────────────────────────────────────────────────── */}
      <section id="login" className="py-5 bg-light" style={{ scrollMarginTop: '60px' }}>
        <div className="container py-4">
          <div className="text-center mb-4">
            <span className="badge bg-primary text-white fw-semibold px-3 py-2 rounded-pill mb-2">
              <i className="bi bi-key-fill me-1"></i>Secure Authentication Portal
            </span>
            <h2 className="fw-bold text-dark display-6">Sign In to Your Account</h2>
            <p className="text-muted mx-auto" style={{ maxWidth: '600px' }}>
              Access your Estate Control Panel, Beneficiary Portal, or Verifier Review Center.
            </p>
          </div>

          <div className="row justify-content-center">
            <div className="col-lg-6 col-md-8">
              <div className="card shadow login-glass-card bg-white p-4 p-md-5">
                {/* Brand Header inside card */}
                <div className="text-center mb-4">
                  <div className="d-inline-flex p-3 rounded-circle mb-3 bg-primary bg-opacity-10 text-primary">
                    <i className="bi bi-shield-lock-fill" style={{ fontSize: '2.4rem' }}></i>
                  </div>
                  <h4 className="fw-bold text-dark mb-1">Account Inheritance Manager</h4>
                  <p className="text-muted small">Enter your registered email and password to access your account</p>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="alert alert-danger py-2 small d-flex align-items-center mb-3">
                    <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
                    <div>{error}</div>
                  </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold small text-dark">Email Address</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light text-muted border-end-0">
                        <i className="bi bi-envelope"></i>
                      </span>
                      <input
                        type="email"
                        name="email"
                        className="form-control border-start-0"
                        value={form.email}
                        onChange={handleChange}
                        required
                        placeholder="name@example.com"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label className="form-label fw-semibold small text-dark mb-0">Password</label>
                    </div>
                    <div className="input-group">
                      <span className="input-group-text bg-light text-muted border-end-0">
                        <i className="bi bi-lock"></i>
                      </span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        className="form-control border-start-0 border-end-0"
                        value={form.password}
                        onChange={handleChange}
                        required
                        placeholder="Password"
                      />
                      <button
                        type="button"
                        className="btn btn-light border border-start-0 text-muted"
                        onClick={() => setShowPassword(!showPassword)}
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100 py-2 fw-semibold rounded-3 shadow-sm"
                    disabled={loading}
                  >
                    {loading ? (
                      <><span className="spinner-border spinner-border-sm me-2"></span>Signing in...</>
                    ) : (
                      <><i className="bi bi-box-arrow-in-right me-2"></i>Sign In</>
                    )}
                  </button>
                </form>

                <hr className="my-4" />

                <div className="text-center">
                  <p className="small text-muted mb-0">
                    Don&apos;t have an account?{' '}
                    <Link to="/register" className="text-primary fw-semibold">
                      Create an account here
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          5. CONTACT SECTION
      ────────────────────────────────────────────────────────────────────────── */}
      <section id="contact" className="py-5 bg-white border-top">
        <div className="container py-4">
          <div className="text-center mb-5">
            <span className="badge bg-primary-subtle text-primary fw-bold px-3 py-2 rounded-pill mb-2">
              <i className="bi bi-headset me-1"></i>24/7 Dedicated Assistance
            </span>
            <h2 className="fw-bold text-dark display-6">Contact & Support</h2>
            <p className="text-muted mx-auto" style={{ maxWidth: '650px' }}>
              Have questions regarding account setup, emergency claims, or becoming an authorized legal verifier?
              Reach out to our specialist team.
            </p>
          </div>

          <div className="row g-4">
            {/* Contact Channels */}
            <div className="col-lg-5">
              <div className="card h-100 border-0 shadow-sm p-4 bg-light rounded-4">
                <h4 className="fw-bold text-dark mb-4">Direct Inquiries</h4>

                <div className="vstack gap-4">
                  <div className="d-flex align-items-start">
                    <div className="p-3 bg-primary text-white rounded-3 me-3">
                      <i className="bi bi-telephone-fill fs-5"></i>
                    </div>
                    <div>
                      <h6 className="fw-bold mb-1">24/7 Emergency Claim Desk</h6>
                      <p className="text-muted small mb-0">+1 (800) 555-HEIR (Toll-free)</p>
                      <small className="text-success fw-semibold">Available 24/7 for active succession cases</small>
                    </div>
                  </div>

                  <div className="d-flex align-items-start">
                    <div className="p-3 bg-success text-white rounded-3 me-3">
                      <i className="bi bi-envelope-check-fill fs-5"></i>
                    </div>
                    <div>
                      <h6 className="fw-bold mb-1">Estate & Verifier Support</h6>
                      <p className="text-muted small mb-0">support@accountinheritance.org</p>
                      <small className="text-muted">Response within 2-4 business hours</small>
                    </div>
                  </div>

                  <div className="d-flex align-items-start">
                    <div className="p-3 bg-dark text-white rounded-3 me-3">
                      <i className="bi bi-building fs-5"></i>
                    </div>
                    <div>
                      <h6 className="fw-bold mb-1">Security & Trust Headquarters</h6>
                      <p className="text-muted small mb-0">Financial Tech Center, 500 Legacy Boulevard, Suite 700</p>
                      <small className="text-muted">New York, NY 10005, United States</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Contact Form */}
            <div className="col-lg-7">
              <div className="card h-100 border-0 shadow-sm p-4 bg-light rounded-4">
                <h4 className="fw-bold text-dark mb-3">Send Us a Message</h4>
                <p className="text-muted small mb-4">Fill out the form below and an estate specialist will get back to you promptly.</p>

                <form onSubmit={handleContactSubmit}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Your Full Name</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="John Doe"
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Email Address</label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="name@example.com"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-semibold">Inquiry Type</label>
                      <select
                        className="form-select"
                        value={contactForm.inquiryType}
                        onChange={(e) => setContactForm({ ...contactForm, inquiryType: e.target.value })}
                      >
                        <option value="General Inquiry">General Platform Inquiry</option>
                        <option value="Emergency Claim">Emergency Access Claim Assistance</option>
                        <option value="Verifier Inquiry">Legal / Medical Verifier Onboarding</option>
                        <option value="Security Inquiry">Cryptographic Security & Compliance</option>
                      </select>
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-semibold">Your Message</label>
                      <textarea
                        className="form-control"
                        rows="4"
                        placeholder="How can our digital inheritance team assist you today?"
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        required
                      ></textarea>
                    </div>

                    <div className="col-12">
                      <button
                        type="submit"
                        className="btn btn-primary px-4 py-2 fw-semibold rounded-3 shadow-sm"
                        disabled={contactSubmitting}
                      >
                        {contactSubmitting ? (
                          <><span className="spinner-border spinner-border-sm me-2"></span>Sending...</>
                        ) : (
                          <><i className="bi bi-send me-2"></i>Send Message</>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          6. FOOTER
      ────────────────────────────────────────────────────────────────────────── */}
      <footer className="bg-dark text-white pt-5 pb-4">
        <div className="container">
          <div className="row g-4 pb-4 border-bottom border-secondary">
            <div className="col-lg-5">
              <div className="d-flex align-items-center mb-3">
                <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-2" style={{ width: '34px', height: '34px' }}>
                  <i className="bi bi-shield-lock-fill"></i>
                </div>
                <h5 className="mb-0 fw-bold text-white">Account Inheritance Manager</h5>
              </div>
              <p className="text-secondary small mb-3" style={{ maxWidth: '400px' }}>
                The gold standard in digital asset succession, credentials protection, and verified emergency inheritance transfer.
              </p>
              <div className="d-flex gap-2">
                <span className="badge bg-secondary bg-opacity-50 text-light border border-secondary">AES-256-GCM</span>
                <span className="badge bg-secondary bg-opacity-50 text-light border border-secondary">Zero Knowledge</span>
                <span className="badge bg-secondary bg-opacity-50 text-light border border-secondary">GDPR Compliant</span>
              </div>
            </div>

            <div className="col-6 col-lg-2">
              <h6 className="fw-bold text-light mb-3">Navigation</h6>
              <ul className="list-unstyled small vstack gap-2">
                <li><button type="button" onClick={() => scrollToSection('home')} className="text-secondary bg-transparent border-0 p-0 text-start">Home</button></li>
                <li><button type="button" onClick={() => scrollToSection('how-it-works')} className="text-secondary bg-transparent border-0 p-0 text-start">How It Works</button></li>
                <li><button type="button" onClick={() => scrollToSection('contact')} className="text-secondary bg-transparent border-0 p-0 text-start">Contact</button></li>
                <li><button type="button" onClick={() => scrollToSection('login')} className="text-secondary bg-transparent border-0 p-0 text-start">Sign In</button></li>
              </ul>
            </div>

            <div className="col-6 col-lg-2">
              <h6 className="fw-bold text-light mb-3">Resources</h6>
              <ul className="list-unstyled small vstack gap-2">
                <li><Link to="/register" className="text-secondary">Register Account</Link></li>
                <li><button type="button" onClick={() => scrollToSection('home')} className="text-secondary bg-transparent border-0 p-0 text-start">Overview</button></li>
                <li><button type="button" onClick={() => scrollToSection('how-it-works')} className="text-secondary bg-transparent border-0 p-0 text-start">Succession Guide</button></li>
                <li><button type="button" onClick={() => scrollToSection('contact')} className="text-secondary bg-transparent border-0 p-0 text-start">Support Desk</button></li>
              </ul>
            </div>

            <div className="col-lg-3">
              <h6 className="fw-bold text-light mb-3">Emergency Response</h6>
              <p className="text-secondary small mb-2">
                For time-sensitive estate claims and verifier validations:
              </p>
              <div className="fw-bold text-info small mb-1">
                <i className="bi bi-telephone me-1"></i>+1 (800) 555-HEIR
              </div>
              <div className="text-secondary small">
                <i className="bi bi-envelope me-1"></i>claims@accountinheritance.org
              </div>
            </div>
          </div>

          <div className="pt-3 d-flex flex-wrap justify-content-between align-items-center text-secondary small">
            <div>
              © 2026 <strong>Account Inheritance Manager</strong>. All rights reserved.
            </div>
            <div className="d-flex gap-3 mt-2 mt-sm-0">
              <span>Zero-Trust Architecture</span>
              <span>•</span>
              <span>Encrypted Storage</span>
              <span>•</span>
              <span>Tamper-Proof Audit</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
