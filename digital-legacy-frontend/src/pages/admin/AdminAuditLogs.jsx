import React, { useEffect, useState } from 'react';
import { getAuditLogs } from '../../api/adminService';
import { toast } from 'react-toastify';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchLogs = () => {
    setLoading(true);
    getAuditLogs({ page, size: 15 })
      .then(res => {
        const d = res.data.data;
        setLogs(d.content || []);
        setTotalPages(d.totalPages || 0);
      })
      .catch(() => toast.error('Failed to load administrator audit trail'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-0 text-dark">Security Audit Trail</h4>
          <small className="text-muted">Immutable log of all administrative actions, overrides, and security events</small>
        </div>
        <button className="btn btn-outline-danger btn-sm" onClick={fetchLogs}>
          <i className="bi bi-arrow-clockwise me-1"></i>Refresh Trail
        </button>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center p-5"><div className="spinner-border text-danger"></div></div>
          ) : logs.length === 0 ? (
            <div className="text-center p-5 text-muted">No audit events recorded yet.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Action</th>
                    <th>Target Entity</th>
                    <th>Target ID</th>
                    <th>Details</th>
                    <th>Admin</th>
                    <th>IP Address</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id}>
                      <td><span className="badge bg-dark">{log.action}</span></td>
                      <td><span className="badge bg-light text-dark border">{log.targetEntity}</span></td>
                      <td className="fw-bold text-muted small">#{log.targetId}</td>
                      <td>
                        <small className="text-muted" title={log.details}>
                          {log.details || '-'}
                        </small>
                      </td>
                      <td className="small fw-semibold">{log.adminEmail}</td>
                      <td className="small text-muted">{log.ipAddress || 'Internal'}</td>
                      <td className="small text-muted">
                        {log.createdAt ? new Date(log.createdAt).toLocaleString() : '-'}
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
