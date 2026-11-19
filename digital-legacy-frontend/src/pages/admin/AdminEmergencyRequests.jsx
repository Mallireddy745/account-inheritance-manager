import React, { useEffect, useState } from 'react';
import { getAdminRequests, downloadAdminEvidence } from '../../api/adminService';
import { toast } from 'react-toastify';

export default function AdminEmergencyRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [claimTypeFilter, setClaimTypeFilter] = useState('');
  const [docFilter, setDocFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Document Inspection Modal
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const fetchRequests = () => {
    setLoading(true);
    const params = { page, size: 10 };
    if (statusFilter) params.status = statusFilter;
    if (claimTypeFilter) params.claimType = claimTypeFilter;
    if (search.trim()) params.search = search.trim();

    getAdminRequests(params)
      .then(res => {
        const d = res.data.data;
        let list = d.content || [];
        if (docFilter === 'has_doc') {
          list = list.filter(r => !!r.evidenceFileName);
        } else if (docFilter === 'no_doc') {
          list = list.filter(r => !r.evidenceFileName);
        }
        setRequests(list);
        setTotalPages(d.totalPages || 0);
      })
      .catch(() => toast.error('Failed to load inheritance access requests'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRequests();
  }, [page, statusFilter, claimTypeFilter, docFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    fetchRequests();
  };

  const handleDownloadDoc = async (reqId, fileName) => {
    setDownloadingId(reqId);
    try {
      await downloadAdminEvidence(reqId, fileName);
      toast.success(`Downloaded evidence document "${fileName}"`);
    } catch {
      toast.error('Failed to download evidence document');
    } finally {
      setDownloadingId(null);
    }
  };

  const statusBadge = (s) => {
    const map = {
      APPROVED: { bg: 'success', label: 'Approved by Verifier' },
      UNDER_REVIEW: { bg: 'info text-dark', label: 'Under Review' },
      ADDITIONAL_INFORMATION_REQUIRED: { bg: 'warning text-dark', label: 'Info Required' },
      REJECTED: { bg: 'danger', label: 'Rejected' },
      PENDING: { bg: 'secondary', label: 'Pending Verifier' },
      COMPLETED: { bg: 'dark', label: 'Completed' }
    };
    const c = map[s] || { bg: 'secondary', label: s };
    return <span className={`badge bg-${c.bg}`}>{c.label}</span>;
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h4 className="fw-bold mb-0 text-dark">
            <i className="bi bi-file-earmark-check-fill text-danger me-2"></i>
            Verified Documents &amp; Inheritance Requests
          </h4>
          <small className="text-muted">
            Administrative oversight and inspection of documents reviewed or approved by licensed Verifiers.
          </small>
        </div>
      </div>

      {/* Audit Oversight Notice */}
      <div className="alert alert-light border shadow-sm d-flex align-items-center mb-4 py-2 px-3">
        <i className="bi bi-shield-check fs-4 text-success me-3"></i>
        <div className="small text-secondary">
          <strong className="text-dark">Read-Only Audit Oversight:</strong> Approving, rejecting, or requesting additional information on inheritance claims is strictly conducted by licensed Verifiers in the Verifier Portal. The Admin Panel provides complete visibility into supporting legal documents, verification rationale, and audit history.
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <form onSubmit={handleSearchSubmit} className="row g-2 align-items-center">
            <div className="col-md-3">
              <div className="input-group">
                <span className="input-group-text bg-white"><i className="bi bi-search"></i></span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search owner, heir, or email..."
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
                <option value="APPROVED">APPROVED (Verified)</option>
                <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                <option value="ADDITIONAL_INFORMATION_REQUIRED">ADDITIONAL_INFO_REQUIRED</option>
                <option value="PENDING">PENDING</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>
            <div className="col-md-2">
              <select
                className="form-select"
                value={claimTypeFilter}
                onChange={e => { setClaimTypeFilter(e.target.value); setPage(0); }}
              >
                <option value="">All Case Types</option>
                <option value="DEATH_VERIFICATION">Death Verification</option>
                <option value="INCAPACITY_VERIFICATION">Incapacity Verification</option>
              </select>
            </div>
            <div className="col-md-2">
              <select
                className="form-select"
                value={docFilter}
                onChange={e => { setDocFilter(e.target.value); setPage(0); }}
              >
                <option value="">All Evidence Types</option>
                <option value="has_doc">With Attached Document</option>
                <option value="no_doc">No Document Attached</option>
              </select>
            </div>
            <div className="col-md-2 d-flex gap-2">
              <button type="submit" className="btn btn-outline-danger w-100">
                Filter
              </button>
              {(statusFilter || claimTypeFilter || docFilter || search) && (
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => { setStatusFilter(''); setClaimTypeFilter(''); setDocFilter(''); setSearch(''); setPage(0); }}
                >
                  Reset
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center p-5"><div className="spinner-border text-danger"></div></div>
          ) : requests.length === 0 ? (
            <div className="text-center p-5 text-muted">
              <i className="bi bi-folder-x fs-1 text-secondary mb-2 d-block"></i>
              No inheritance access requests match the selected criteria.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Req #</th>
                    <th>Case Type</th>
                    <th>Beneficiary Heir</th>
                    <th>Estate Owner</th>
                    <th>Supporting Document</th>
                    <th>Verifier Status</th>
                    <th>Verifier Officer &amp; Notes</th>
                    <th>Submitted</th>
                    <th className="text-end px-3">Actions</th>
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
                        <div className="fw-semibold small">{r.beneficiaryName}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>{r.beneficiaryEmail}</div>
                      </td>
                      <td>
                        <div className="fw-semibold small">{r.ownerName}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>{r.ownerEmail}</div>
                      </td>
                      <td>
                        {r.evidenceFileName ? (
                          <button
                            className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                            onClick={() => handleDownloadDoc(r.id, r.evidenceFileName)}
                            disabled={downloadingId === r.id}
                            title="Download and review supporting evidence document"
                          >
                            {downloadingId === r.id ? (
                              <span className="spinner-border spinner-border-sm"></span>
                            ) : (
                              <i className="bi bi-file-earmark-medical-fill text-danger"></i>
                            )}
                            <span className="text-truncate" style={{ maxWidth: '140px' }}>
                              {r.evidenceFileName}
                            </span>
                            {r.evidenceFileSize && (
                              <span className="badge bg-light text-secondary border ms-1" style={{ fontSize: '0.65rem' }}>
                                {(r.evidenceFileSize / 1024).toFixed(0)} KB
                              </span>
                            )}
                          </button>
                        ) : (
                          <span className="text-muted small fst-italic">No document attached</span>
                        )}
                      </td>
                      <td>{statusBadge(r.status)}</td>
                      <td>
                        {r.reviewedByAdminName ? (
                          <div className="small fw-semibold text-primary">
                            <i className="bi bi-patch-check-fill me-1"></i>
                            {r.reviewedByAdminName}
                          </div>
                        ) : (
                          <div className="small text-muted">Awaiting Verifier</div>
                        )}
                        <small className="text-secondary text-truncate d-block" style={{ maxWidth: '180px' }} title={r.verificationNotes || r.rejectionReason || r.adminNotes}>
                          {r.verificationNotes || r.rejectionReason || r.adminNotes || '-'}
                        </small>
                      </td>
                      <td className="text-muted small">
                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="text-end px-3">
                        <button
                          className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1"
                          onClick={() => setSelectedRequest(r)}
                          title="View case details and verified documents"
                        >
                          <i className="bi bi-eye"></i> View Details
                        </button>
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

      {/* Read-Only Details & Document Inspection Modal */}
      {selectedRequest && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content shadow-lg border-0">
              <div className="modal-header bg-dark text-white">
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-file-earmark-text-fill text-warning fs-5"></i>
                  <h5 className="modal-title mb-0">
                    Inheritance Request #{selectedRequest.id} &mdash; Document &amp; Case Audit
                  </h5>
                </div>
                <button className="btn-close btn-close-white" onClick={() => setSelectedRequest(null)}></button>
              </div>

              <div className="modal-body p-4">
                {/* Case Status Banner */}
                <div className="d-flex justify-content-between align-items-center p-3 mb-4 rounded bg-light border">
                  <div>
                    <span className="text-muted small text-uppercase fw-semibold d-block">Verification Status</span>
                    <div className="mt-1">{statusBadge(selectedRequest.status)}</div>
                  </div>
                  <div className="text-end">
                    <span className="text-muted small text-uppercase fw-semibold d-block">Case Type</span>
                    <span className="badge bg-secondary">
                      {selectedRequest.claimType === 'DEATH_VERIFICATION' ? 'Death Verification' : 'Incapacity Verification'}
                    </span>
                  </div>
                </div>

                {/* Parties Details */}
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <div className="card h-100 border-0 bg-light">
                      <div className="card-body">
                        <h6 className="fw-bold text-muted small text-uppercase mb-2">
                          <i className="bi bi-person-fill text-secondary me-1"></i>
                          Estate Owner
                        </h6>
                        <div className="fw-bold text-dark">{selectedRequest.ownerName}</div>
                        <div className="text-muted small">{selectedRequest.ownerEmail}</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card h-100 border-0 bg-light">
                      <div className="card-body">
                        <h6 className="fw-bold text-muted small text-uppercase mb-2">
                          <i className="bi bi-person-heart text-danger me-1"></i>
                          Beneficiary Heir
                        </h6>
                        <div className="fw-bold text-dark">{selectedRequest.beneficiaryName}</div>
                        <div className="text-muted small">{selectedRequest.beneficiaryEmail}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Claim Statement */}
                <div className="mb-4">
                  <h6 className="fw-bold text-muted small text-uppercase mb-2">
                    <i className="bi bi-chat-left-text me-1"></i>
                    Claim Reason / Heir Statement
                  </h6>
                  <div className="p-3 bg-white border rounded text-secondary small">
                    {selectedRequest.reason || 'No claim reason provided.'}
                  </div>
                </div>

                {/* Supporting Document Card */}
                <div className="card border mb-4 shadow-sm">
                  <div className="card-header bg-light fw-bold small text-uppercase d-flex justify-content-between align-items-center">
                    <span>
                      <i className="bi bi-paperclip me-1 text-primary"></i>
                      Submitted Supporting Document
                    </span>
                    {selectedRequest.evidenceFileName && (
                      <span className="badge bg-success bg-opacity-10 text-success border border-success">
                        Document Available
                      </span>
                    )}
                  </div>
                  <div className="card-body">
                    {selectedRequest.evidenceFileName ? (
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-3">
                          <i className="bi bi-file-earmark-medical fs-1 text-danger"></i>
                          <div>
                            <div className="fw-bold text-dark">{selectedRequest.evidenceFileName}</div>
                            <small className="text-muted">
                              Size: {(selectedRequest.evidenceFileSize / 1024).toFixed(1)} KB &bull; Verified legal/medical evidence file
                            </small>
                          </div>
                        </div>
                        <button
                          className="btn btn-outline-danger btn-sm d-flex align-items-center gap-2"
                          onClick={() => handleDownloadDoc(selectedRequest.id, selectedRequest.evidenceFileName)}
                          disabled={downloadingId === selectedRequest.id}
                        >
                          {downloadingId === selectedRequest.id ? (
                            <span className="spinner-border spinner-border-sm"></span>
                          ) : (
                            <i className="bi bi-download"></i>
                          )}
                          Download Document
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-3 text-muted small">
                        <i className="bi bi-file-earmark-x fs-3 d-block mb-1 text-secondary"></i>
                        No supporting evidence document was uploaded with this inheritance request.
                      </div>
                    )}
                  </div>
                </div>

                {/* Verifier Review Record */}
                <div className="card border-0 bg-light mb-3">
                  <div className="card-body">
                    <h6 className="fw-bold text-muted small text-uppercase mb-2">
                      <i className="bi bi-patch-check-fill text-primary me-1"></i>
                      Verifier Adjudication &amp; Notes
                    </h6>
                    <div className="row g-2 mb-2 small">
                      <div className="col-sm-6">
                        <strong>Reviewed By Verifier:</strong>{' '}
                        {selectedRequest.reviewedByAdminName || <span className="text-muted">Awaiting Verifier Assignment</span>}
                      </div>
                      <div className="col-sm-6">
                        <strong>Reviewed Date:</strong>{' '}
                        {selectedRequest.reviewedAt ? new Date(selectedRequest.reviewedAt).toLocaleString() : <span className="text-muted">-</span>}
                      </div>
                    </div>
                    <div className="mt-2">
                      <strong className="small text-muted d-block mb-1">Official Review Notes:</strong>
                      <div className="p-2 bg-white rounded border small text-dark">
                        {selectedRequest.verificationNotes || selectedRequest.rejectionReason || selectedRequest.adminNotes || (
                          <span className="text-muted fst-italic">No verifier notes logged yet.</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Compliance Notice */}
                <div className="alert alert-info py-2 small mb-0 d-flex align-items-center">
                  <i className="bi bi-info-circle-fill fs-5 me-2 text-info"></i>
                  <div>
                    <strong>Fiduciary Notice:</strong> Claim approval, rejection, and additional documentation requests are strictly executed by licensed Verifiers under legal protocols. The Admin Portal maintains read-only oversight for compliance and audit logging.
                  </div>
                </div>
              </div>

              <div className="modal-footer bg-light">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelectedRequest(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
