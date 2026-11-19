import React, { useEffect, useState } from 'react';
import { getOwnerRequests, getBeneficiaryRequests, submitRequest, cancelRequest } from '../../api/emergencyRequestService';
import { getAssets } from '../../api/assetService';
import { getBeneficiaries } from '../../api/beneficiaryService';
import { toast } from 'react-toastify';
import { formatApiError } from '../../utils/errorHandler';

export default function EmergencyRequests() {
  const [activeTab, setActiveTab] = useState('OWNER'); // 'OWNER' or 'SUBMITTED'
  const [ownerClaims, setOwnerClaims] = useState([]);
  const [submittedClaims, setSubmittedClaims] = useState([]);
  const [assets, setAssets] = useState([]);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [form, setForm] = useState({ assetId: '', beneficiaryId: '', reason: '' });

  const fetchClaims = () => {
    setLoading(true);
    const p1 = getOwnerRequests({ page: 0, size: 50 });
    const p2 = getBeneficiaryRequests({ page: 0, size: 50 });

    Promise.all([p1, p2])
      .then(([r1, r2]) => {
        setOwnerClaims(r1.data.data?.content || []);
        setSubmittedClaims(r2.data.data?.content || []);
      })
      .catch(() => toast.error('Failed to load emergency claims'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchClaims();
    getAssets().then(res => {
      const d = res.data.data;
      setAssets(Array.isArray(d) ? d : (d.content || []));
    }).catch(() => {});
    getBeneficiaries().then(res => {
      const d = res.data.data;
      setBeneficiaries(Array.isArray(d) ? d : (d.content || []));
    }).catch(() => {});
  }, []);

  const handleSubmitClaim = async (e) => {
    e.preventDefault();

    if (!form.assetId) {
      toast.warning('Please select an asset for this claim');
      return;
    }
    if (!form.beneficiaryId) {
      toast.warning('Please select the designated beneficiary');
      return;
    }
    if (!form.reason || form.reason.trim().length < 5) {
      toast.warning('Please provide a detailed reason (at least 5 characters)');
      return;
    }

    setSubmitting(true);
    try {
      await submitRequest({
        assetId: Number(form.assetId),
        beneficiaryId: Number(form.beneficiaryId),
        reason: form.reason.trim()
      });
      toast.success('Emergency access claim submitted successfully');
      setShowSubmitModal(false);
      setForm({ assetId: '', beneficiaryId: '', reason: '' });
      fetchClaims();
    } catch (err) {
      toast.error(formatApiError(err, 'Failed to submit emergency claim'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelClaim = async (requestId) => {
    if (!window.confirm('Are you sure you want to cancel this pending emergency claim?')) return;
    try {
      await cancelRequest(requestId);
      toast.success('Emergency claim cancelled');
      fetchClaims();
      if (selectedClaim?.id === requestId) setShowDetailModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel claim');
    }
  };

  const openClaimDetails = (claim) => {
    setSelectedClaim(claim);
    setShowDetailModal(true);
  };

  const statusBadge = (s) => {
    const map = {
      PENDING: 'warning',
      UNDER_REVIEW: 'info',
      APPROVED: 'success',
      REJECTED: 'danger',
      COMPLETED: 'secondary'
    };
    return <span className={`badge bg-${map[s] || 'secondary'}`}>{s}</span>;
  };

  const currentList = activeTab === 'OWNER' ? ownerClaims : submittedClaims;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-0 text-dark">Emergency Access Claims</h4>
          <small className="text-muted">Life event triggers, incapacity claims, and legacy execution tracking</small>
        </div>
        <button className="btn btn-danger" onClick={() => setShowSubmitModal(true)}>
          <i className="bi bi-exclamation-triangle-fill me-1"></i>Submit Emergency Claim
        </button>
      </div>

      {/* Workflow Navigation Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link fw-semibold ${activeTab === 'OWNER' ? 'active text-primary' : 'text-secondary'}`}
            onClick={() => setActiveTab('OWNER')}
          >
            <i className="bi bi-shield-lock me-1"></i>Claims on My Estate ({ownerClaims.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link fw-semibold ${activeTab === 'SUBMITTED' ? 'active text-danger' : 'text-secondary'}`}
            onClick={() => setActiveTab('SUBMITTED')}
          >
            <i className="bi bi-send-check me-1"></i>Claims I Submitted ({submittedClaims.length})
          </button>
        </li>
      </ul>

      {/* Claims Table */}
      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center p-5"><div className="spinner-border text-danger"></div></div>
          ) : currentList.length === 0 ? (
            <div className="text-center p-5 text-muted">
              <i className="bi bi-check2-circle fs-1 text-success mb-2 d-block"></i>
              {activeTab === 'OWNER'
                ? 'No emergency claims currently pending on your estate assets.'
                : 'You have not submitted any emergency claims.'}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Asset</th>
                    <th>Beneficiary</th>
                    <th>Reason / Justification</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th className="text-end px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentList.map(r => (
                    <tr key={r.id}>
                      <td className="fw-semibold text-dark">{r.assetName}</td>
                      <td>
                        <div className="fw-semibold small">{r.beneficiaryName}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>{r.beneficiaryEmail}</div>
                      </td>
                      <td>
                        <small className="text-muted" title={r.reason}>
                          {r.reason?.substring(0, 50)}{r.reason?.length > 50 ? '...' : ''}
                        </small>
                      </td>
                      <td>{statusBadge(r.status)}</td>
                      <td className="text-muted small">
                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="text-end px-4">
                        <div className="btn-group btn-group-sm">
                          <button
                            type="button"
                            className="btn btn-outline-info"
                            onClick={() => openClaimDetails(r)}
                            title="View claim history and admin notes"
                          >
                            <i className="bi bi-eye"></i> Details
                          </button>
                          {r.status === 'PENDING' && activeTab === 'OWNER' && (
                            <button
                              type="button"
                              className="btn btn-outline-danger"
                              onClick={() => handleCancelClaim(r.id)}
                              title="Cancel pending claim"
                            >
                              <i className="bi bi-x-circle"></i> Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Claim Detail Modal */}
      {showDetailModal && selectedClaim && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-dark text-white py-3">
                <h5 className="modal-title">
                  <i className="bi bi-file-earmark-medical me-2 text-danger"></i>
                  Emergency Claim Details
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowDetailModal(false)}></button>
              </div>
              <div className="modal-body p-4">
                <div className="mb-3">
                  <label className="text-muted small text-uppercase fw-semibold">Target Asset</label>
                  <div className="fs-5 fw-bold text-dark">{selectedClaim.assetName}</div>
                </div>
                <div className="mb-3">
                  <label className="text-muted small text-uppercase fw-semibold">Claimant / Beneficiary</label>
                  <div><strong>{selectedClaim.beneficiaryName}</strong> ({selectedClaim.beneficiaryEmail})</div>
                </div>
                <div className="mb-3">
                  <label className="text-muted small text-uppercase fw-semibold">Current Claim Status</label>
                  <div>{statusBadge(selectedClaim.status)}</div>
                </div>
                <div className="mb-3">
                  <label className="text-muted small text-uppercase fw-semibold">Justification / Emergency Reason</label>
                  <div className="p-3 border rounded bg-light small">
                    {selectedClaim.reason}
                  </div>
                </div>
                {selectedClaim.adminNotes && (
                  <div className="mb-3">
                    <label className="text-muted small text-uppercase fw-semibold text-danger">
                      <i className="bi bi-shield-check me-1"></i>Admin Review Notes
                    </label>
                    <div className="p-3 border rounded bg-warning bg-opacity-10 small">
                      {selectedClaim.adminNotes}
                    </div>
                  </div>
                )}
                <div className="small text-muted">
                  <strong>Date Submitted:</strong> {selectedClaim.createdAt ? new Date(selectedClaim.createdAt).toLocaleString() : '-'}<br />
                  {selectedClaim.reviewedAt && (
                    <><strong>Date Reviewed:</strong> {new Date(selectedClaim.reviewedAt).toLocaleString()}</>
                  )}
                </div>
              </div>
              <div className="modal-footer bg-light py-2">
                {selectedClaim.status === 'PENDING' && activeTab === 'OWNER' && (
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => handleCancelClaim(selectedClaim.id)}
                  >
                    Cancel Claim
                  </button>
                )}
                <button type="button" className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submit Emergency Claim Modal */}
      {showSubmitModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-danger text-white py-3">
                <h5 className="modal-title">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  Submit Emergency Access Claim
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowSubmitModal(false)}></button>
              </div>
              <form onSubmit={handleSubmitClaim}>
                <div className="modal-body p-4">
                  <div className="alert alert-secondary small py-2 mb-3">
                    <i className="bi bi-info-circle-fill me-1 text-primary"></i>
                    Emergency access is strictly validated by platform administrators prior to credential or asset release.
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Target Asset *</label>
                    <select
                      className="form-select"
                      required
                      value={form.assetId}
                      onChange={e => setForm({ ...form, assetId: e.target.value })}
                    >
                      <option value="">Select estate asset...</option>
                      {assets.map(a => (
                        <option key={a.id} value={a.id}>{a.name || a.assetName}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Beneficiary Submitting Claim *</label>
                    <select
                      className="form-select"
                      required
                      value={form.beneficiaryId}
                      onChange={e => setForm({ ...form, beneficiaryId: e.target.value })}
                    >
                      <option value="">Select beneficiary record...</option>
                      {beneficiaries.map(b => (
                        <option key={b.id} value={b.id}>{b.fullName} ({b.email})</option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Reason & Supporting Justification *</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      required
                      placeholder="Explain the emergency life event or incapacity triggering this asset claim..."
                      value={form.reason}
                      onChange={e => setForm({ ...form, reason: e.target.value })}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer bg-light py-2">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowSubmitModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-danger" disabled={submitting}>
                    {submitting ? 'Submitting Claim...' : 'Submit Claim'}
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
