import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getVerifierRequests,
  markUnderReview,
  approveRequest,
  rejectRequest,
  requestAdditionalInfo,
  downloadEvidence
} from '../../api/verifierService';
import { toast } from 'react-toastify';
import { formatApiError } from '../../utils/errorHandler';

export default function VerifierRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [claimTypeFilter, setClaimTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Review Modal state
  const [selectedReq, setSelectedReq] = useState(null);
  const [actionNotes, setActionNotes] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [downloadingDoc, setDownloadingDoc] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = { page, size: 10 };
      if (statusFilter) params.status = statusFilter;
      if (claimTypeFilter) params.claimType = claimTypeFilter;
      if (search.trim()) params.search = search.trim();

      const res = await getVerifierRequests(params);
      const d = res.data.data;
      setRequests(d.content || []);
      setTotalPages(d.totalPages || 0);
    } catch {
      toast.error('Failed to load inheritance requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [page, statusFilter, claimTypeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    fetchRequests();
  };

  const openReviewModal = (req) => {
    setSelectedReq(req);
    setActionNotes(req.verificationNotes || '');
  };

  const handleMarkUnderReview = async (id) => {
    try {
      await markUnderReview(id);
      toast.info(`Request #${id} marked as UNDER_REVIEW`);
      fetchRequests();
      if (selectedReq?.id === id) {
        setSelectedReq(prev => ({ ...prev, status: 'UNDER_REVIEW' }));
      }
    } catch (err) {
      toast.error(formatApiError(err, 'Failed to update status'));
    }
  };

  const handleApprove = async () => {
    if (!selectedReq) return;
    setSubmittingAction(true);
    try {
      await approveRequest(selectedReq.id, { adminNotes: actionNotes.trim() });
      toast.success(`Request #${selectedReq.id} APPROVED! Beneficiary granted access to authorized assets.`);
      setSelectedReq(null);
      fetchRequests();
    } catch (err) {
      toast.error(formatApiError(err, 'Failed to approve request'));
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleReject = async () => {
    if (!selectedReq) return;
    if (!actionNotes || actionNotes.trim().length < 5) {
      toast.warning('Please enter a rejection reason (min 5 characters) in the comments');
      return;
    }
    setSubmittingAction(true);
    try {
      await rejectRequest(selectedReq.id, { rejectionReason: actionNotes.trim() });
      toast.info(`Request #${selectedReq.id} REJECTED.`);
      setSelectedReq(null);
      fetchRequests();
    } catch (err) {
      toast.error(formatApiError(err, 'Failed to reject request'));
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleRequestInfo = async () => {
    if (!selectedReq) return;
    if (!actionNotes || actionNotes.trim().length < 5) {
      toast.warning('Please specify what additional information is required in the comments');
      return;
    }
    setSubmittingAction(true);
    try {
      await requestAdditionalInfo(selectedReq.id, { additionalInfoRequired: actionNotes.trim() });
      toast.warning(`Request #${selectedReq.id} updated: ADDITIONAL_INFORMATION_REQUIRED`);
      setSelectedReq(null);
      fetchRequests();
    } catch (err) {
      toast.error(formatApiError(err, 'Failed to request additional info'));
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleDownloadEvidence = async (reqId, fileName) => {
    setDownloadingDoc(true);
    try {
      await downloadEvidence(reqId, fileName);
      toast.success(`Downloaded supporting evidence document "${fileName}"`);
    } catch (err) {
      toast.error(formatApiError(err, 'Failed to download supporting evidence'));
    } finally {
      setDownloadingDoc(false);
    }
  };

  const statusBadge = (s) => {
    const map = {
      PENDING: { bg: 'warning text-dark', label: 'Pending' },
      UNDER_REVIEW: { bg: 'info text-dark', label: 'Under Review' },
      ADDITIONAL_INFORMATION_REQUIRED: { bg: 'secondary', label: 'Additional Info Required' },
      APPROVED: { bg: 'success', label: 'Approved' },
      REJECTED: { bg: 'danger', label: 'Rejected' }
    };
    const c = map[s] || { bg: 'secondary', label: s };
    return <span className={`badge bg-${c.bg}`}>{c.label}</span>;
  };

  if (user?.role !== 'VERIFIER' && user?.role !== 'ADMIN') {
    return <Navigate to="/user/dashboard" replace />;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-0 text-dark">
            <i className="bi bi-patch-check-fill text-warning me-2"></i>
            Inheritance Access Requests
          </h4>
          <small className="text-muted">
            Licensed Verifier Panel. Review supporting legal &amp; medical documents, verify relationships, and approve or reject inheritance claims.
          </small>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <form onSubmit={handleSearchSubmit} className="row g-2 align-items-center">
            <div className="col-md-4">
              <div className="input-group">
                <span className="input-group-text bg-white"><i className="bi bi-search"></i></span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by owner, beneficiary or email..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setPage(0); }}
              >
                <option value="">All Verification Statuses</option>
                <option value="PENDING">PENDING</option>
                <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                <option value="ADDITIONAL_INFORMATION_REQUIRED">ADDITIONAL_INFO_REQUIRED</option>
                <option value="APPROVED">APPROVED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={claimTypeFilter}
                onChange={e => { setClaimTypeFilter(e.target.value); setPage(0); }}
              >
                <option value="">All Claim Types</option>
                <option value="DEATH_VERIFICATION">Death Verification</option>
                <option value="INCAPACITY_VERIFICATION">Incapacity Verification</option>
              </select>
            </div>
            <div className="col-md-2 d-flex gap-2">
              <button type="submit" className="btn btn-primary w-100">
                Filter
              </button>
              {(statusFilter || claimTypeFilter || search) && (
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => { setStatusFilter(''); setClaimTypeFilter(''); setSearch(''); setPage(0); }}
                >
                  Reset
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Requests Table */}
      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>
          ) : requests.length === 0 ? (
            <div className="text-center p-5 text-muted">
              <i className="bi bi-journal-x fs-1 text-secondary mb-2 d-block"></i>
              No inheritance access requests match the specified criteria.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Req #</th>
                    <th>Case Type</th>
                    <th>Estate Owner</th>
                    <th>Beneficiary Heir</th>
                    <th>Supporting Evidence</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th className="text-end px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(r => (
                    <tr key={r.id}>
                      <td className="fw-bold">#{r.id}</td>
                      <td>
                        <span className="badge bg-light text-dark border">
                          {r.claimType === 'DEATH_VERIFICATION' ? 'Death Verification' : 'Incapacity Verification'}
                        </span>
                      </td>
                      <td>
                        <div className="fw-semibold">{r.ownerName}</div>
                      </td>
                      <td>
                        <div className="fw-semibold">{r.beneficiaryName}</div>
                        <small className="text-muted">{r.beneficiaryEmail}</small>
                      </td>
                      <td>
                        {r.evidenceFileName ? (
                          <button
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => handleDownloadEvidence(r.id, r.evidenceFileName)}
                            disabled={downloadingDoc}
                            title="Download and review supporting evidence document"
                          >
                            <i className="bi bi-file-earmark-medical me-1"></i>
                            {r.evidenceFileName}
                          </button>
                        ) : (
                          <span className="text-muted small fst-italic">No document attached</span>
                        )}
                      </td>
                      <td>{statusBadge(r.status)}</td>
                      <td className="text-muted small">
                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="text-end px-4">
                        <div className="btn-group btn-group-sm">
                          {r.status === 'PENDING' && (
                            <button
                              className="btn btn-outline-info"
                              onClick={() => handleMarkUnderReview(r.id)}
                              title="Mark as Under Review"
                            >
                              <i className="bi bi-search"></i>
                            </button>
                          )}
                          <button
                            className="btn btn-primary"
                            onClick={() => openReviewModal(r)}
                          >
                            <i className="bi bi-pencil-square me-1"></i>Review
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="card-footer bg-white d-flex justify-content-between align-items-center py-2">
            <button
              className="btn btn-outline-secondary btn-sm"
              disabled={page === 0}
              onClick={() => setPage(p => Math.max(0, p - 1))}
            >
              Previous
            </button>
            <span className="small text-muted">Page {page + 1} of {totalPages}</span>
            <button
              className="btn btn-outline-secondary btn-sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Verification Review Modal */}
      {selectedReq && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} tabIndex="-1">
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-dark text-white py-3">
                <h5 className="modal-title">
                  <i className="bi bi-shield-check text-warning me-2"></i>
                  Verify Inheritance Claim #{selectedReq.id}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedReq(null)}></button>
              </div>
              <div className="modal-body p-4">
                {/* Case Info Cards */}
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <div className="p-3 bg-light rounded border">
                      <div className="text-muted small text-uppercase fw-semibold mb-1">Estate Owner Details</div>
                      <div className="fw-bold fs-6">{selectedReq.ownerName}</div>
                      <div className="small text-muted">Owner ID: #{selectedReq.ownerId}</div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="p-3 bg-light rounded border">
                      <div className="text-muted small text-uppercase fw-semibold mb-1">Beneficiary Heir Details</div>
                      <div className="fw-bold fs-6">{selectedReq.beneficiaryName}</div>
                      <div className="small text-muted">{selectedReq.beneficiaryEmail}</div>
                      <div className="small text-muted">Beneficiary ID: #{selectedReq.beneficiaryId}</div>
                    </div>
                  </div>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="text-muted small text-uppercase fw-semibold">Case Type</label>
                    <div>
                      <span className="badge bg-primary bg-opacity-10 text-primary border fs-6">
                        {selectedReq.claimType === 'DEATH_VERIFICATION' ? 'Death Verification' : 'Incapacity Verification'}
                      </span>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="text-muted small text-uppercase fw-semibold">Current Status</label>
                    <div>{statusBadge(selectedReq.status)}</div>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="text-muted small text-uppercase fw-semibold">Claim Explanation / Reason</label>
                  <div className="p-3 bg-light rounded border small">
                    {selectedReq.reason}
                  </div>
                </div>

                {/* Evidence Document Section */}
                <div className="mb-4">
                  <label className="text-muted small text-uppercase fw-semibold">Supporting Legal Document</label>
                  {selectedReq.evidenceFileName ? (
                    <div className="p-3 border rounded bg-white d-flex justify-content-between align-items-center">
                      <div>
                        <i className="bi bi-file-earmark-medical-fill text-danger fs-4 me-2"></i>
                        <span className="fw-semibold">{selectedReq.evidenceFileName}</span>
                        {selectedReq.evidenceFileSize && (
                          <small className="text-muted ms-2">
                            ({(selectedReq.evidenceFileSize / 1024).toFixed(1)} KB)
                          </small>
                        )}
                      </div>
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => handleDownloadEvidence(selectedReq.id, selectedReq.evidenceFileName)}
                        disabled={downloadingDoc}
                      >
                        {downloadingDoc ? (
                          <span className="spinner-border spinner-border-sm me-1"></span>
                        ) : (
                          <i className="bi bi-download me-1"></i>
                        )}
                        Download &amp; Inspect
                      </button>
                    </div>
                  ) : (
                    <div className="p-2 bg-light rounded border text-muted small fst-italic">
                      No supporting documents uploaded for this request.
                    </div>
                  )}
                </div>

                {/* Verification Comments Form */}
                <div className="mb-3">
                  <label className="form-label fw-bold small text-muted text-uppercase">
                    Verification Comments / Decision Notes *
                  </label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Enter verification findings, document authenticity notes, reason for rejection or additional information needed..."
                    value={actionNotes}
                    onChange={e => setActionNotes(e.target.value)}
                  ></textarea>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="modal-footer bg-light py-2 d-flex flex-wrap justify-content-between">
                <div>
                  {selectedReq.status !== 'UNDER_REVIEW' && (
                    <button
                      type="button"
                      className="btn btn-outline-info me-2"
                      onClick={() => handleMarkUnderReview(selectedReq.id)}
                      disabled={submittingAction}
                    >
                      <i className="bi bi-search me-1"></i>Mark Under Review
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-outline-warning"
                    onClick={handleRequestInfo}
                    disabled={submittingAction}
                  >
                    <i className="bi bi-question-circle me-1"></i>Request Info
                  </button>
                </div>

                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={handleReject}
                    disabled={submittingAction}
                  >
                    <i className="bi bi-x-circle me-1"></i>Reject Claim
                  </button>
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={handleApprove}
                    disabled={submittingAction}
                  >
                    <i className="bi bi-check-circle me-1"></i>Approve &amp; Grant Access
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
