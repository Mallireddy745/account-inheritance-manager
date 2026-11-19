import React, { useEffect, useState } from 'react';
import { getDashboard } from '../../api/dashboardService';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = () => {
    setLoading(true);
    getDashboard()
      .then(res => setData(res.data.data))
      .catch(() => toast.error('Failed to load dashboard metrics'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center p-5">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  if (!data) return <div className="alert alert-warning">No dashboard metrics available</div>;

  const stats = [
    { label: 'Total Assets', value: data.totalAssets || 0, icon: 'bi-archive', color: 'primary', link: '/user/assets' },
    { label: 'Beneficiaries', value: data.totalBeneficiaries || 0, icon: 'bi-people', color: 'success', link: '/user/beneficiaries' },
    { label: 'Active Permissions', value: data.activePermissions || 0, icon: 'bi-shield-check', color: 'info', link: '/user/permissions' },
    { label: 'Pending Claims', value: data.pendingRequests || 0, icon: 'bi-clock-history', color: 'warning', link: '/user/inherited-assets' },
    { label: 'Completed Transfers', value: data.completedRequests || 0, icon: 'bi-check2-all', color: 'secondary', link: '/user/inherited-assets' },
  ];

  const catDist = data.categoryDistribution || {};
  const colors = ['#2563eb', '#10b981', '#06b6d4', '#f59e0b', '#ef4444', '#8b5cf6', '#f97316', '#14b8a6', '#64748b', '#ec4899'];
  const chartData = {
    labels: Object.keys(catDist),
    datasets: [{
      data: Object.values(catDist),
      backgroundColor: colors.slice(0, Object.keys(catDist).length),
    }],
  };

  return (
    <div>
      {/* Header Banner */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1 text-dark">
            Welcome back, {user?.fullName || user?.email} 👋
          </h4>
          <small className="text-muted">Your digital estate protection and legacy distribution overview</small>
        </div>
        <button className="btn btn-outline-primary btn-sm" onClick={fetchDashboard}>
          <i className="bi bi-arrow-clockwise me-1"></i>Refresh
        </button>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="row g-2 mb-4">
        <div className="col-sm-6 col-md-3">
          <Link to="/user/assets" className="btn btn-primary w-100 py-2 d-flex align-items-center justify-content-center shadow-sm">
            <i className="bi bi-plus-circle me-2"></i>Add Digital Asset
          </Link>
        </div>
        <div className="col-sm-6 col-md-3">
          <Link to="/user/beneficiaries" className="btn btn-success w-100 py-2 d-flex align-items-center justify-content-center shadow-sm">
            <i className="bi bi-person-plus me-2"></i>Designate Beneficiary
          </Link>
        </div>
        <div className="col-sm-6 col-md-3">
          <Link to="/user/permissions" className="btn btn-info text-white w-100 py-2 d-flex align-items-center justify-content-center shadow-sm">
            <i className="bi bi-shield-lock me-2"></i>Grant Permission
          </Link>
        </div>
        <div className="col-sm-6 col-md-3">
          <Link to="/user/inherited-assets" className="btn btn-outline-primary w-100 py-2 d-flex align-items-center justify-content-center shadow-sm">
            <i className="bi bi-gift me-2"></i>Beneficiary Portal
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="row g-3 mb-4">
        {stats.map(s => (
          <div className="col-sm-6 col-md-4 col-xl" key={s.label}>
            <Link to={s.link} className="text-decoration-none">
              <div className="card shadow-sm border-0 h-100">
                <div className="card-body text-center py-3">
                  <div className={`p-3 d-inline-flex rounded-circle bg-${s.color} bg-opacity-10 text-${s.color} mb-2`}>
                    <i className={`bi ${s.icon} fs-4`}></i>
                  </div>
                  <div className={`fs-3 fw-bold text-${s.color}`}>{s.value}</div>
                  <small className="text-muted fw-semibold">{s.label}</small>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Analytics, Activity, Notifications */}
      <div className="row g-4">
        {/* Category Breakdown Chart */}
        <div className="col-lg-4">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white fw-semibold border-0 pt-3">
              Asset Category Allocation
            </div>
            <div className="card-body d-flex align-items-center justify-content-center">
              {Object.keys(catDist).length > 0 ? (
                <div style={{ maxWidth: '280px', width: '100%' }}>
                  <Doughnut
                    data={chartData}
                    options={{
                      maintainAspectRatio: true,
                      plugins: {
                        legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
                      },
                    }}
                  />
                </div>
              ) : (
                <div className="text-center p-4 text-muted">
                  <i className="bi bi-pie-chart fs-1 text-secondary mb-2 d-block"></i>
                  No digital assets registered yet.<br />
                  <Link to="/user/assets" className="btn btn-sm btn-outline-primary mt-2">Add Your First Asset</Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="col-lg-4">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white fw-semibold border-0 pt-3 d-flex justify-content-between align-items-center">
              <span>Recent Activity History</span>
              <span className="badge bg-primary bg-opacity-10 text-primary">Live Log</span>
            </div>
            <div className="card-body p-0" style={{ maxHeight: '380px', overflowY: 'auto' }}>
              {(data.recentActivities || []).length === 0 ? (
                <p className="p-4 text-muted text-center mb-0">No recent activities logged</p>
              ) : (
                <ul className="list-group list-group-flush">
                  {data.recentActivities.slice(0, 8).map((a, i) => (
                    <li key={i} className="list-group-item py-2 px-3">
                      <div className="fw-semibold small text-dark d-flex align-items-center">
                        <i className="bi bi-clock-history text-muted me-2"></i>
                        {a.action}
                      </div>
                      <div className="text-muted small ps-4">{a.description}</div>
                      <div className="text-secondary ps-4" style={{ fontSize: '0.75rem' }}>
                        {a.createdAt ? new Date(a.createdAt).toLocaleString() : ''}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Notifications Feed */}
        <div className="col-lg-4">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white fw-semibold border-0 pt-3 d-flex justify-content-between align-items-center">
              <span>Security & Estate Alerts</span>
              <Link to="/user/notifications" className="small text-decoration-none">View All →</Link>
            </div>
            <div className="card-body p-0" style={{ maxHeight: '380px', overflowY: 'auto' }}>
              {(data.recentNotifications || []).length === 0 ? (
                <p className="p-4 text-muted text-center mb-0">No new alerts</p>
              ) : (
                <ul className="list-group list-group-flush">
                  {data.recentNotifications.slice(0, 8).map((n, i) => (
                    <li key={i} className={`list-group-item py-2 px-3 ${!n.isRead ? 'bg-primary bg-opacity-10' : ''}`}>
                      <div className="fw-semibold small text-dark d-flex justify-content-between">
                        <span>{n.title}</span>
                        {!n.isRead && <span className="badge bg-primary" style={{ fontSize: '0.65rem' }}>New</span>}
                      </div>
                      <div className="text-muted small">{n.message}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
