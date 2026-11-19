import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/routing/ProtectedRoute';
import AdminRoute from './components/routing/AdminRoute';
import UserLayout from './components/layout/UserLayout';
import AdminLayout from './components/layout/AdminLayout';

// Public pages
import Login from './pages/public/Login';
import Register from './pages/public/Register';

// User Panel pages
import Dashboard from './pages/user/Dashboard';
import Assets from './pages/user/Assets';
import Beneficiaries from './pages/user/Beneficiaries';
import Permissions from './pages/user/Permissions';
import EmergencyRequests from './pages/user/EmergencyRequests';
import BeneficiaryPortal from './pages/user/BeneficiaryPortal';
import Notifications from './pages/user/Notifications';
import Profile from './pages/user/Profile';
import Settings from './pages/user/Settings';

// Verifier Panel pages
import VerifierRequests from './pages/verifier/VerifierRequests';

// Admin Panel pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminAssets from './pages/admin/AdminAssets';
import AdminBeneficiaries from './pages/admin/AdminBeneficiaries';
import AdminEmergencyRequests from './pages/admin/AdminEmergencyRequests';
import AdminVerifications from './pages/admin/AdminVerifications';
import AdminAuditLogs from './pages/admin/AdminAuditLogs';
import AdminReports from './pages/admin/AdminReports';
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminSettings from './pages/admin/AdminSettings';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Admin Public Route */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* User Panel Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<UserLayout />}>
              <Route path="/user/dashboard" element={<Dashboard />} />
              <Route path="/user/assets" element={<Assets />} />
              <Route path="/user/beneficiaries" element={<Beneficiaries />} />
              <Route path="/user/permissions" element={<Permissions />} />
              <Route path="/user/inherited-assets" element={<BeneficiaryPortal />} />
              <Route path="/user/beneficiary-portal" element={<Navigate to="/user/inherited-assets" replace />} />
              <Route path="/user/emergency-requests" element={<EmergencyRequests />} />
              <Route path="/user/notifications" element={<Notifications />} />
              <Route path="/user/profile" element={<Profile />} />
              <Route path="/user/settings" element={<Settings />} />

              {/* Verifier Panel Route */}
              <Route path="/verifier/requests" element={<VerifierRequests />} />
            </Route>
          </Route>

          {/* Admin Panel Protected Routes */}
          <Route element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/assets" element={<AdminAssets />} />
              <Route path="/admin/beneficiaries" element={<AdminBeneficiaries />} />
              <Route path="/admin/requests" element={<AdminEmergencyRequests />} />
              <Route path="/admin/verifications" element={<AdminVerifications />} />
              <Route path="/admin/audit-logs" element={<AdminAuditLogs />} />
              <Route path="/admin/reports" element={<AdminReports />} />
              <Route path="/admin/notifications" element={<AdminNotifications />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
            </Route>
          </Route>

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
