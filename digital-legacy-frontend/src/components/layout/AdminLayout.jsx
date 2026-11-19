import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = async () => {
    await logout();
    toast.info('Logged out successfully');
    navigate('/admin/login');
  };

  const navLinks = [
    { to: '/admin/dashboard', icon: 'bi-speedometer2', label: 'Dashboard' },
    { to: '/admin/users', icon: 'bi-people', label: 'Users' },
    { to: '/admin/assets', icon: 'bi-archive', label: 'Assets' },
    { to: '/admin/beneficiaries', icon: 'bi-person-check', label: 'Beneficiaries' },
    { to: '/admin/requests', icon: 'bi-exclamation-octagon', label: 'Inheritance Requests' },
    { to: '/admin/verifications', icon: 'bi-patch-check', label: 'Verifications' },
    { to: '/admin/audit-logs', icon: 'bi-journal-text', label: 'Audit Logs' },
    { to: '/admin/reports', icon: 'bi-bar-chart', label: 'Reports' },
    { to: '/admin/notifications', icon: 'bi-bell', label: 'Notifications' },
    { to: '/admin/settings', icon: 'bi-gear', label: 'Settings' },
  ];

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      {sidebarOpen && (
        <div className="d-flex flex-column" style={{ width: '260px', minHeight: '100vh', flexShrink: 0, backgroundColor: '#1a1a2e' }}>
          <div className="p-3 border-bottom" style={{ borderColor: '#16213e' }}>
            <h5 className="mb-0 fw-bold" style={{ color: '#e94560' }}>
              <i className="bi bi-shield-exclamation me-2"></i>Admin Panel
            </h5>
            <small className="text-secondary">Account Inheritance Manager</small>
          </div>
          <nav className="p-2 flex-grow-1">
            {navLinks.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `d-flex align-items-center px-3 py-2 mb-1 rounded text-decoration-none ${isActive ? 'text-white' : 'text-secondary sidebar-link'}`
                }
                style={({ isActive }) => isActive ? { backgroundColor: '#e94560' } : {}}
              >
                <i className={`bi ${link.icon} me-2`}></i>
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      )}

      <div className="flex-grow-1 d-flex flex-column" style={{ minWidth: 0 }}>
        <nav className="navbar navbar-light bg-white border-bottom px-3 shadow-sm">
          <div className="d-flex align-items-center">
            <button className="btn btn-outline-secondary btn-sm me-3" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <i className="bi bi-list"></i>
            </button>
            <span className="fw-bold text-danger">Admin Control Center</span>
          </div>
          <div className="ms-auto d-flex align-items-center gap-3">
            <span className="text-muted small">
              <i className="bi bi-person-badge me-1"></i>{user?.email}
            </span>
            <button className="btn btn-outline-danger btn-sm" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right me-1"></i>Logout
            </button>
          </div>
        </nav>

        <div className="flex-grow-1 p-4 bg-light" style={{ overflowY: 'auto' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
