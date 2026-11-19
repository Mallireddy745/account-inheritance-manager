import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getUnreadCount } from '../../api/notificationService';
import { toast } from 'react-toastify';

export default function UserLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnread = () => {
    getUnreadCount()
      .then(res => setUnreadCount(res.data.data || 0))
      .catch(() => {});
  };

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000); // refresh count every 30s
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await logout();
    toast.info('Logged out successfully');
    navigate('/login');
  };

  let navLinks = [];
  let roleTitle = 'Estate Management';
  let navTitle = 'Estate Control Panel';

  if (user?.role === 'VERIFIER') {
    roleTitle = 'Licensed Verifier';
    navTitle = 'Verifier Review Center';
    navLinks = [
      { to: '/verifier/requests', icon: 'bi-patch-check-fill', label: 'Inheritance Requests' },
      { to: '/user/notifications', icon: 'bi-bell', label: 'Notifications', badge: unreadCount },
      { to: '/user/profile', icon: 'bi-person-circle', label: 'My Profile' },
      { to: '/user/settings', icon: 'bi-gear', label: 'Security Settings' },
    ];
  } else if (user?.role === 'BENEFICIARY') {
    roleTitle = 'Beneficiary Account';
    navTitle = 'Beneficiary Inheritance Portal';
    navLinks = [
      { to: '/user/inherited-assets', icon: 'bi-gift-fill', label: 'Beneficiary Dashboard' },
      { to: '/user/notifications', icon: 'bi-bell', label: 'Notifications', badge: unreadCount },
      { to: '/user/profile', icon: 'bi-person-circle', label: 'My Profile' },
      { to: '/user/settings', icon: 'bi-gear', label: 'Security Settings' },
    ];
  } else {
    // Estate Owner (USER)
    roleTitle = 'Estate Owner';
    navTitle = 'Estate Control Panel';
    navLinks = [
      { to: '/user/dashboard', icon: 'bi-speedometer2', label: 'Dashboard' },
      { to: '/user/assets', icon: 'bi-archive', label: 'Digital Assets' },
      { to: '/user/beneficiaries', icon: 'bi-people', label: 'My Beneficiaries' },
      { to: '/user/permissions', icon: 'bi-shield-check', label: 'Permissions' },
      { to: '/user/inherited-assets', icon: 'bi-gift-fill', label: 'Beneficiary Portal' },
      { to: '/user/notifications', icon: 'bi-bell', label: 'Notifications', badge: unreadCount },
      { to: '/user/profile', icon: 'bi-person-circle', label: 'My Profile' },
      { to: '/user/settings', icon: 'bi-gear', label: 'Security Settings' },
    ];
  }

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      {sidebarOpen && (
        <div className="bg-dark text-white d-flex flex-column" style={{ width: '260px', minHeight: '100vh', flexShrink: 0 }}>
          <div className="p-3 border-bottom border-secondary d-flex align-items-center justify-content-between">
            <div>
              <h5 className="mb-0 text-primary fw-bold d-flex align-items-center">
                <i className="bi bi-shield-lock-fill me-2"></i>Account Inheritance
              </h5>
              <small className="badge bg-secondary bg-opacity-50 mt-1">{roleTitle}</small>
            </div>
          </div>
          <nav className="p-2 flex-grow-1">
            {navLinks.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `d-flex align-items-center justify-content-between px-3 py-2 mb-1 rounded text-decoration-none ${
                    isActive ? 'bg-primary text-white' : 'text-light sidebar-link'
                  }`
                }
              >
                <div className="d-flex align-items-center">
                  <i className={`bi ${link.icon} me-2`}></i>
                  {link.label}
                </div>
                {link.badge > 0 && (
                  <span className="badge bg-danger rounded-pill">{link.badge}</span>
                )}
              </NavLink>
            ))}
          </nav>
          <div className="p-3 border-top border-secondary">
            <div className="d-flex align-items-center">
              <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-2" style={{ width: '36px', height: '36px' }}>
                <i className="bi bi-person-fill"></i>
              </div>
              <div className="text-truncate" style={{ maxWidth: '170px' }}>
                <div className="small fw-bold text-white text-truncate">{user?.fullName || 'User'}</div>
                <div className="text-secondary small text-truncate" style={{ fontSize: '0.75rem' }}>{user?.email}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-grow-1 d-flex flex-column" style={{ minWidth: 0 }}>
        {/* Top Navbar */}
        <nav className="navbar navbar-light bg-white border-bottom px-3 shadow-sm">
          <div className="d-flex align-items-center">
            <button className="btn btn-outline-secondary btn-sm me-3" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <i className="bi bi-list"></i>
            </button>
            <span className="fw-semibold text-dark d-none d-md-inline">{navTitle}</span>
          </div>

          <div className="ms-auto d-flex align-items-center gap-3">
            {/* Notification Bell */}
            <Link to="/user/notifications" className="btn btn-outline-secondary btn-sm position-relative">
              <i className="bi bi-bell"></i>
              {unreadCount > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.65rem' }}>
                  {unreadCount}
                </span>
              )}
            </Link>

            <span className="text-muted small d-none d-sm-inline">
              Signed in as <strong>{user?.fullName || user?.email}</strong>
            </span>

            <button className="btn btn-outline-danger btn-sm" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right me-1"></i>Logout
            </button>
          </div>
        </nav>

        {/* Page Content View */}
        <div className="flex-grow-1 p-4 bg-light" style={{ overflowY: 'auto' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
