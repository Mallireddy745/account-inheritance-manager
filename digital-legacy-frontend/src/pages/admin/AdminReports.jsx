import React, { useEffect, useState } from 'react';
import { getAdminDashboard } from '../../api/adminService';
import { toast } from 'react-toastify';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function AdminReports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminDashboard()
      .then(res => setData(res.data.data))
      .catch(() => toast.error('Failed to generate report summaries'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center p-5">
        <div className="spinner-border text-danger"></div>
      </div>
    );
  }

  const catDist = data?.categoryDistribution || {};
  const barData = {
    labels: Object.keys(catDist),
    datasets: [{
      label: 'Digital Assets',
      data: Object.values(catDist),
      backgroundColor: '#2563eb',
    }],
  };

  const userDistribution = {
    labels: ['Active', 'Inactive', 'Suspended'],
    datasets: [{
      data: [data?.activeUsers || 0, data?.inactiveUsers || 0, data?.suspendedUsers || 0],
      backgroundColor: ['#10b981', '#64748b', '#ef4444'],
    }],
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-0 text-dark">Platform Analytics & Reports</h4>
          <small className="text-muted">High-level operational metrics and compliance summaries</small>
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-lg-8">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white fw-semibold border-0 pt-3">
              Asset Category Volume
            </div>
            <div className="card-body">
              {Object.keys(catDist).length > 0 ? (
                <Bar data={barData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
              ) : (
                <p className="text-muted text-center py-5">No asset category data to chart</p>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white fw-semibold border-0 pt-3">
              User Status Composition
            </div>
            <div className="card-body d-flex align-items-center justify-content-center">
              <div style={{ maxWidth: '240px', width: '100%' }}>
                <Doughnut data={userDistribution} options={{ plugins: { legend: { position: 'bottom' } } }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Table */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white fw-semibold border-0 pt-3">
          Summary Metrics Table
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-striped align-middle mb-0">
              <tbody>
                <tr>
                  <td className="fw-semibold px-4">Total Registered Users</td>
                  <td className="text-end px-4">{data?.totalUsers || 0}</td>
                </tr>
                <tr>
                  <td className="fw-semibold px-4">Active Estate Accounts</td>
                  <td className="text-end px-4 text-success fw-bold">{data?.activeUsers || 0}</td>
                </tr>
                <tr>
                  <td className="fw-semibold px-4">Total Digital Assets Managed</td>
                  <td className="text-end px-4">{data?.totalAssets || 0}</td>
                </tr>
                <tr>
                  <td className="fw-semibold px-4">Total Designated Beneficiaries</td>
                  <td className="text-end px-4">{data?.totalBeneficiaries || 0}</td>
                </tr>
                <tr>
                  <td className="fw-semibold px-4">Pending Emergency Access Claims</td>
                  <td className="text-end px-4 text-warning fw-bold">{data?.pendingRequests || 0}</td>
                </tr>
                <tr>
                  <td className="fw-semibold px-4">Approved Emergency Claims</td>
                  <td className="text-end px-4 text-success">{data?.approvedRequests || 0}</td>
                </tr>
                <tr>
                  <td className="fw-semibold px-4">Pending Identity Verifications</td>
                  <td className="text-end px-4 text-danger fw-bold">{data?.pendingVerifications || 0}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
