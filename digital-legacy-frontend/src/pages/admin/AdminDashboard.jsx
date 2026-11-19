import React, { useEffect, useState } from 'react';
import { getAdminDashboard } from '../../api/adminService';
import { toast } from 'react-toastify';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = () => {
    setLoading(true);
    getAdminDashboard()
      .then(res => setData(res.data.data))
      .catch(() => toast.error('Failed to load admin dashboard metrics'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center p-5">
        <div className="spinner-border text-danger"></div>
      </div>
    );
  }

  if (!data) return <div className="alert alert-warning">No dashboard metrics available.</div>;

  const userStats = [
    { label: 'Total Users', value: data.totalUsers || 0, icon: 'bi-people', color: 'primary' },
    { label: 'Active Users', value: data.activeUsers || 0, icon: 'bi-person-check', color: 'success' },
    { label: 'Inactive Users', value: data.inactiveUsers || 0, icon: 'bi-person-x', color: 'secondary' },
    { label: 'Suspended Users', value: data.suspendedUsers || 0, icon: 'bi-person-slash', color: 'danger' },
  ];

  const platformStats = [
    { label: 'Total Assets', value: data.totalAssets || 0, icon: 'bi-archive', color: 'info' },
    { label: 'Beneficiaries', value: data.totalBeneficiaries || 0, icon: 'bi-person-badge', color: 'success' },
    { label: 'Pending Requests', value: data.pendingRequests || 0, icon: 'bi-clock-history', color: 'warning' },
    { label: 'Approved Requests', value: data.approvedRequests || 0, icon: 'bi-check-circle', color: 'success' },
    { label: 'Pending Verifications', value: data.pendingVerifications || 0, icon: 'bi-patch-check', color: 'danger' },
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-0 text-dark">Platform Overview</h4>
          <small className="text-muted">Real-time system health and management metrics</small>
        </div>
        <button className="btn btn-outline-danger btn-sm" onClick={fetchDashboard}>
          <i className="bi bi-arrow-clockwise me-1"></i>Refresh Data
        </button>
      </div>

      {/* User Stats Row */}
      <h6 className="fw-bold text-uppercase text-muted small mb-3">User Distribution</h6>
      <div className="row g-3 mb-4">
        {userStats.map(s => (
          <div className="col-sm-6 col-md-3" key={s.label}>
            <div className="card shadow-sm border-0">
              <div className="card-body d-flex align-items-center justify-content-between py-3">
                <div>
                  <small className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.75rem' }}>{s.label}</small>
                  <div className={`fs-3 fw-bold text-${s.color} mt-1`}>{s.value}</div>
                </div>
                <div className={`p-3 rounded-circle bg-${s.color} bg-opacity-10 text-${s.color}`}>
                  <i className={`bi ${s.icon} fs-4`}></i>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Operational Stats Row */}
      <h6 className="fw-bold text-uppercase text-muted small mb-3">Estate & Operations</h6>
      <div className="row g-3 mb-4">
        {platformStats.map(s => (
          <div className="col-sm-6 col-md-4 col-xl" key={s.label}>
            <div className="card shadow-sm border-0">
              <div className="card-body text-center py-3">
                <i className={`bi ${s.icon} text-${s.color} fs-3`}></i>
                <div className={`fs-3 fw-bold text-${s.color} mt-1`}>{s.value}</div>
                <small className="text-muted">{s.label}</small>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts & Logs */}
      <div className="row g-4">
        <div className="col-lg-5">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white fw-semibold border-0 pt-3">
              Asset Category Breakdown
            </div>
            <div className="card-body d-flex align-items-center justify-content-center">
              {Object.keys(catDist).length > 0 ? (
                <div style={{ maxWidth: '300px', width: '100%' }}>
                  <Doughnut data={chartData} options={{ plugins: { legend: { position: 'bottom', labels: { boxWidth: 12 } } } }} />
                </div>
              ) : (
                <p className="text-muted mb-0">No digital assets recorded yet</p>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-7">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white fw-semibold border-0 pt-3 d-flex justify-content-between align-items-center">
              <span>Recent Admin Audit Trail</span>
              <span className="badge bg-danger bg-opacity-10 text-danger">Security</span>
            </div>
            <div className="card-body p-0" style={{ maxHeight: '380px', overflowY: 'auto' }}>
              {(data.recentAuditLogs || []).length === 0 ? (
                <p className="p-4 text-muted mb-0">No admin operations logged yet</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.85rem' }}>
                    <thead className="table-light">
                      <tr>
                        <th>Action</th>
                        <th>Target</th>
                        <th>Admin</th>
                        <th>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentAuditLogs.map(log => (
                        <tr key={log.id}>
                          <td><span className="badge bg-secondary">{log.action}</span></td>
                          <td>{log.targetEntity} #{log.targetId}</td>
                          <td>{log.adminEmail}</td>
                          <td className="text-muted">
                            {log.createdAt ? new Date(log.createdAt).toLocaleString() : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
