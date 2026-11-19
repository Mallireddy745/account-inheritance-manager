import React, { useEffect, useState } from 'react';
import { getAdminBeneficiaries } from '../../api/adminService';
import { toast } from 'react-toastify';

export default function AdminBeneficiaries() {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchBeneficiaries = () => {
    setLoading(true);
    const params = { page, size: 10 };
    if (search) params.search = search;

    getAdminBeneficiaries(params)
      .then(res => {
        const d = res.data.data;
        setBeneficiaries(d.content || []);
        setTotalPages(d.totalPages || 0);
      })
      .catch(() => toast.error('Failed to load platform beneficiaries'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBeneficiaries();
  }, [page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    fetchBeneficiaries();
  };

  const statusBadge = (s) => {
    const map = {
      VERIFIED: 'success',
      UNVERIFIED: 'warning',
      PENDING_VERIFICATION: 'info',
      REJECTED: 'danger'
    };
    return <span className={`badge bg-${map[s] || 'secondary'}`}>{s}</span>;
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-0 text-dark">Platform Beneficiaries</h4>
          <small className="text-muted">Global directory of designated beneficiaries and their verification status</small>
        </div>
      </div>

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <form onSubmit={handleSearch} className="row g-2 align-items-center">
            <div className="col-md-9">
              <div className="input-group">
                <span className="input-group-text bg-white"><i className="bi bi-search"></i></span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search beneficiary by name or email..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-3">
              <button type="submit" className="btn btn-dark w-100">
                <i className="bi bi-search me-1"></i>Search
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center p-5"><div className="spinner-border text-danger"></div></div>
          ) : beneficiaries.length === 0 ? (
            <div className="text-center p-5 text-muted">No beneficiaries recorded on the platform.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Beneficiary</th>
                    <th>Relationship</th>
                    <th>Phone</th>
                    <th>Verification</th>
                    <th>Assigned Assets</th>
                    <th>Registered</th>
                  </tr>
                </thead>
                <tbody>
                  {beneficiaries.map(b => (
                    <tr key={b.id}>
                      <td>
                        <div className="fw-semibold">{b.fullName}</div>
                        <div className="text-muted small">{b.email}</div>
                      </td>
                      <td>{b.relationship}</td>
                      <td>{b.phoneNumber || '-'}</td>
                      <td>{statusBadge(b.verificationStatus)}</td>
                      <td>
                        <span className="badge bg-primary bg-opacity-10 text-primary">
                          {b.assignedAssetsCount || 0}
                        </span>
                      </td>
                      <td className="text-muted small">
                        {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="card-footer bg-white d-flex justify-content-between align-items-center py-3">
            <span className="small text-muted">Page {page + 1} of {totalPages}</span>
            <div className="btn-group">
              <button
                className="btn btn-outline-secondary btn-sm"
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
              >
                Previous
              </button>
              <button
                className="btn btn-outline-secondary btn-sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
