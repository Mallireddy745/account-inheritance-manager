import React, { useEffect, useState } from 'react';
import { getVerifications, approveVerification, rejectVerification, downloadVerificationDocument } from '../../api/adminService';
import { toast } from 'react-toastify';

export default function AdminVerifications() {
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [downloadingDocId, setDownloadingDocId] = useState(null);

  const [selectedItem, setSelectedItem] = useState(null);
  const [actionType, setActionType] = useState('APPROVE');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchVerifications = () => {
    setLoading(true);
    const params = { page, size: 10 };
    if (statusFilter) params.status = statusFilter;

    getVerifications(params)
      .then(res => {
        const d = res.data.data;
        setVerifications(d.content || []);
        setTotalPages(d.totalPages || 0);
      })
      .catch(() => toast.error('Failed to load verification records'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchVerifications();
  }, [page, statusFilter]);

  const openActionModal = (item, type) => {
    setSelectedItem(item);
    setActionType(type);
    setNotes('');
  };

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;
    setSubmitting(true);
    try {
      if (actionType === 'APPROVE') {
        await approveVerification(selectedItem.id, { adminNotes: notes });
        toast.success('Beneficiary verified successfully');
      } else {
        await rejectVerification(selectedItem.id, { rejectionReason: notes });
        toast.info('Verification rejected');
      }
      setSelectedItem(null);
      fetchVerifications();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadDoc = async (id, fileName) => {
    setDownloadingDocId(id);
    try {
      await downloadVerificationDocument(id, fileName);
      toast.success(`Downloaded verification document "${fileName}"`);
    } catch {
      toast.error('Failed to download document');
    } finally {
      setDownloadingDocId(null);
    }
  };

  const getStatusBadge = (s) => {
    switch (s) {
      case 'APPROVED': return <span className="badge bg-success">Approved</span>;
      case 'PENDING': return <span className="badge bg-warning">Pending Review</span>;
      case 'REJECTED': return <span className="badge bg-danger">Rejected</span>;
      default: return <span className="badge bg-secondary">{s}</span>;
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-0 text-dark">Identity & Relationship Verifications</h4>
          <small className="text-muted">Validate identity documents and beneficiary qualifications</small>
        </div>
      </div>

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <div className="row g-2 align-items-center">
            <div className="col-md-6">
              <select
                className="form-select"
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setPage(0); }}
              >
                <option value="">All Verification Statuses</option>
                <option value="PENDING">PENDING</option>
                <option value="APPROVED">APPROVED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>
            <div className="col-md-3">
              <button className="btn btn-outline-danger w-100" onClick={fetchVerifications}>
                <i className="bi bi-arrow-clockwise me-1"></i>Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center p-5"><div className="spinner-border text-danger"></div></div>
          ) : verifications.length === 0 ? (
            <div className="text-center p-5 text-muted">No verification records found.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Beneficiary</th>
                    <th>Type</th>
                    <th>Estate Owner</th>
                    <th>Verification Document</th>
                    <th>Status</th>
                    <th>Reviewer</th>
                    <th>Submitted</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {verifications.map(v => (
                    <tr key={v.id}>
                      <td>
                        <div className="fw-semibold">{v.beneficiaryName}</div>
                        <div className="text-muted small">{v.beneficiaryEmail}</div>
                      </td>
                      <td><span className="badge bg-light text-dark border">{v.verificationType}</span></td>
                      <td className="small text-muted">{v.ownerEmail}</td>
                      <td>
                        {v.documentFileName ? (
                          <button
                            className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                            onClick={() => handleDownloadDoc(v.id, v.documentFileName)}
                            disabled={downloadingDocId === v.id}
                            title="Download verification proof document"
                          >
                            {downloadingDocId === v.id ? (
                              <span className="spinner-border spinner-border-sm"></span>
                            ) : (
                              <i className="bi bi-file-earmark-check-fill text-danger"></i>
                            )}
                            <span className="text-truncate" style={{ maxWidth: '120px' }}>
                              {v.documentFileName}
                            </span>
                            {v.documentFileSize && (
                              <span className="badge bg-light text-secondary border ms-1" style={{ fontSize: '0.65rem' }}>
                                {(v.documentFileSize / 1024).toFixed(0)} KB
                              </span>
                            )}
                          </button>
                        ) : (
                          <span className="text-muted small fst-italic">No document</span>
                        )}
                      </td>
                      <td>{getStatusBadge(v.status)}</td>
                      <td className="small text-muted">{v.verifierAdminEmail || 'Not reviewed'}</td>
                      <td className="small text-muted">
                        {v.createdAt ? new Date(v.createdAt).toLocaleDateString() : '-'}
                      </td>
                      <td>
                        {v.status === 'PENDING' ? (
                          <div className="btn-group btn-group-sm">
                            <button className="btn btn-success" onClick={() => openActionModal(v, 'APPROVE')}>
                              Verify
                            </button>
                            <button className="btn btn-danger" onClick={() => openActionModal(v, 'REJECT')}>
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-muted small">Completed</span>
                        )}
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

      {/* Action Modal */}
      {selectedItem && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className={`modal-header ${actionType === 'APPROVE' ? 'bg-success text-white' : 'bg-danger text-white'}`}>
                <h5 className="modal-title">
                  {actionType === 'APPROVE' ? 'Approve Verification' : 'Reject Verification'}
                </h5>
                <button className="btn-close btn-close-white" onClick={() => setSelectedItem(null)}></button>
              </div>
              <form onSubmit={handleActionSubmit}>
                <div className="modal-body">
                  <p className="small mb-3">
                    <strong>Beneficiary:</strong> {selectedItem.beneficiaryName} ({selectedItem.beneficiaryEmail})<br />
                    <strong>Verification Type:</strong> {selectedItem.verificationType}
                  </p>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      {actionType === 'APPROVE' ? 'Verification Notes (Optional)' : 'Rejection Reason (Required)'}
                    </label>
                    <textarea
                      className="form-control"
                      rows="3"
                      required={actionType === 'REJECT'}
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setSelectedItem(null)}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`btn ${actionType === 'APPROVE' ? 'btn-success' : 'btn-danger'}`}
                    disabled={submitting}
                  >
                    {submitting ? 'Saving...' : 'Confirm'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
