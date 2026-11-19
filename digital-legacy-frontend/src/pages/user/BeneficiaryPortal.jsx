import React, { useEffect, useState } from 'react';
import {
  getBeneficiaryPortalSummary,
  getMyInvitations,
  acceptInvitation,
  declineInvitation,
  getMyOwners,
  getInheritedAssets,
  getAuthorizedDocuments,
  submitBeneficiaryClaim,
  getMyBeneficiaryClaims,
  uploadSupportingDoc,
  downloadInheritedFile
} from '../../api/beneficiaryPortalService';
import { toast } from 'react-toastify';
import { formatApiError } from '../../utils/errorHandler';

export default function BeneficiaryPortal() {
  const [activeTab, setActiveTab] = useState('invitations'); // invitations, owners, assets, requests, authorized
  const [loading, setLoading] = useState(true);

  // Data states
  const [summary, setSummary] = useState(null);
  const [invitations, setInvitations] = useState([]);
  const [owners, setOwners] = useState([]);
  const [assignedAssets, setAssignedAssets] = useState([]);
  const [authorizedAssets, setAuthorizedAssets] = useState([]);
  const [claims, setClaims] = useState([]);

  // Claim Request Modal
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimOwnerId, setClaimOwnerId] = useState('');
  const [claimType, setClaimType] = useState('DEATH_VERIFICATION');
  const [claimReason, setClaimReason] = useState('');
  const [supportingFile, setSupportingFile] = useState(null);
  const [submittingClaim, setSubmittingClaim] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Asset detail modal
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [revealedSecrets, setRevealedSecrets] = useState({});
  const [downloadingFileId, setDownloadingFileId] = useState(null);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [sumRes, invRes, ownRes, assRes, authRes, clmRes] = await Promise.all([
        getBeneficiaryPortalSummary().catch(() => ({ data: { data: null } })),
        getMyInvitations().catch(() => ({ data: { data: [] } })),
        getMyOwners().catch(() => ({ data: { data: [] } })),
        getInheritedAssets().catch(() => ({ data: { data: [] } })),
        getAuthorizedDocuments().catch(() => ({ data: { data: [] } })),
        getMyBeneficiaryClaims({ page: 0, size: 50 }).catch(() => ({ data: { data: { content: [] } } }))
      ]);

      setSummary(sumRes.data.data);
      setInvitations(invRes.data.data || []);
      setOwners(ownRes.data.data || []);
      setAssignedAssets(assRes.data.data || []);
      setAuthorizedAssets(authRes.data.data || []);
      setClaims(clmRes.data.data?.content || []);
    } catch {
      toast.error('Failed to load beneficiary portal data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleAcceptInvite = async (invitationId, ownerName) => {
    try {
      await acceptInvitation(invitationId);
      toast.success(`Accepted nomination from ${ownerName}`);
      fetchAllData();
    } catch (err) {
      toast.error(formatApiError(err, 'Failed to accept invitation'));
    }
  };

  const handleDeclineInvite = async (invitationId, ownerName) => {
    if (!window.confirm(`Are you sure you want to decline nomination from ${ownerName}?`)) return;
    try {
      await declineInvitation(invitationId);
      toast.info(`Declined nomination from ${ownerName}`);
      fetchAllData();
    } catch (err) {
      toast.error(formatApiError(err, 'Failed to decline invitation'));
    }
  };

  const openClaimModal = (ownerId = '') => {
    setClaimOwnerId(ownerId ? String(ownerId) : (owners.length > 0 ? String(owners[0].ownerId) : ''));
    setClaimType('DEATH_VERIFICATION');
    setClaimReason('');
    setSupportingFile(null);
    setShowClaimModal(true);
  };

  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    if (!claimOwnerId) {
      toast.warning('Please select an estate owner');
      return;
    }
    if (!claimReason || claimReason.trim().length < 5) {
      toast.warning('Please provide a detailed reason for requesting inheritance access (min 5 characters)');
      return;
    }

    setSubmittingClaim(true);
    let evidenceFileId = null;

    try {
      if (supportingFile) {
        setUploadingDoc(true);
        const uploadRes = await uploadSupportingDoc(supportingFile);
        evidenceFileId = uploadRes.data.data?.id;
        setUploadingDoc(false);
      }

      const matchedOwner = owners.find(o => String(o.ownerId) === String(claimOwnerId));
      const beneRecordId = matchedOwner?.beneficiaryRecordId;

      await submitBeneficiaryClaim({
        ownerId: parseInt(claimOwnerId),
        beneficiaryId: beneRecordId || null,
        claimType: claimType,
        reason: claimReason.trim(),
        evidenceFileId: evidenceFileId
      });

      toast.success('Inheritance access request submitted! Status is PENDING verifier review.');
      setShowClaimModal(false);
      setClaimReason('');
      setSupportingFile(null);
      setActiveTab('requests');
      fetchAllData();
    } catch (err) {
      toast.error(formatApiError(err, 'Failed to submit inheritance access request'));
    } finally {
      setSubmittingClaim(false);
      setUploadingDoc(false);
    }
  };

  const handleDownloadFile = async (assetId, fileId, fileName) => {
    setDownloadingFileId(fileId);
    try {
      await downloadInheritedFile(assetId, fileId, fileName);
      toast.success(`Downloaded authorized file "${fileName}"`);
    } catch (err) {
      toast.error(formatApiError(err, 'Failed to download file. Verification may be required.'));
    } finally {
      setDownloadingFileId(null);
    }
  };

  const toggleSecret = (assetId) => {
    setRevealedSecrets(prev => ({
      ...prev,
      [assetId]: !prev[assetId]
    }));
  };

  const openInspectModal = (asset) => {
    setSelectedAsset(asset);
    setShowDetailModal(true);
  };

  const requestStatusBadge = (status) => {
    const map = {
      PENDING: { bg: 'warning text-dark', icon: 'bi-clock-history', label: 'Pending Verification' },
      UNDER_REVIEW: { bg: 'info text-dark', icon: 'bi-search', label: 'Under Review' },
      ADDITIONAL_INFORMATION_REQUIRED: { bg: 'secondary', icon: 'bi-question-circle', label: 'Additional Info Required' },
      APPROVED: { bg: 'success', icon: 'bi-check-circle-fill', label: 'Approved & Granted' },
      REJECTED: { bg: 'danger', icon: 'bi-x-circle-fill', label: 'Rejected' }
    };
    const c = map[status] || { bg: 'secondary', icon: 'bi-circle', label: status };
    return (
      <span className={`badge bg-${c.bg} d-inline-flex align-items-center gap-1`}>
        <i className={`bi ${c.icon}`}></i>
        {c.label}
      </span>
    );
  };

  const pendingInvitesCount = invitations.filter(i => i.invitationStatus === 'PENDING').length;

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h4 className="fw-bold mb-0 text-dark">
            <i className="bi bi-gift-fill text-primary me-2"></i>
            Beneficiary Inheritance Portal
          </h4>
          <small className="text-muted">
            Independent beneficiary access dashboard. Private credentials remain securely locked until inheritance verification is approved.
          </small>
        </div>
        <button className="btn btn-primary shadow-sm" onClick={() => openClaimModal()}>
          <i className="bi bi-shield-plus me-1"></i>
          Request Inheritance Access
        </button>
      </div>

      {/* Security Banner */}
      <div className="alert alert-light border shadow-sm mb-4">
        <div className="d-flex align-items-center">
          <div className="bg-primary bg-opacity-10 text-primary p-2 rounded-circle me-3">
            <i className="bi bi-key-fill fs-4"></i>
          </div>
          <div>
            <div className="fw-bold text-dark">Zero-Knowledge Owner Password Protection</div>
            <div className="small text-muted">
              You are logged in with your own independent account. You never need an owner&apos;s password. Private files and credentials are only unlocked after supporting documentation (e.g. death or incapacity certificate) is reviewed and approved by a licensed verifier.
            </div>
          </div>
        </div>
      </div>

      {/* Metric Counters */}
      <div className="row g-3 mb-4">
        <div className="col-md-3 col-6">
          <div className="card shadow-sm border-0 border-start border-warning border-4">
            <div className="card-body p-3">
              <div className="text-muted small fw-semibold text-uppercase">Pending Invitations</div>
              <div className="fs-3 fw-bold text-warning">{pendingInvitesCount}</div>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-6">
          <div className="card shadow-sm border-0 border-start border-primary border-4">
            <div className="card-body p-3">
              <div className="text-muted small fw-semibold text-uppercase">Nominated Owners</div>
              <div className="fs-3 fw-bold text-primary">{owners.length}</div>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-6">
          <div className="card shadow-sm border-0 border-start border-info border-4">
            <div className="card-body p-3">
              <div className="text-muted small fw-semibold text-uppercase">Assigned Assets</div>
              <div className="fs-3 fw-bold text-info">{assignedAssets.length}</div>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-6">
          <div className="card shadow-sm border-0 border-start border-success border-4">
            <div className="card-body p-3">
              <div className="text-muted small fw-semibold text-uppercase">Authorized Documents</div>
              <div className="fs-3 fw-bold text-success">{authorizedAssets.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabbed Navigation */}
      <ul className="nav nav-pills mb-4 bg-white p-2 rounded shadow-sm border">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'invitations' ? 'active' : ''}`}
            onClick={() => setActiveTab('invitations')}
          >
            <i className="bi bi-envelope-open me-1"></i>
            My Invitations
            {pendingInvitesCount > 0 && (
              <span className="badge bg-danger rounded-pill ms-2">{pendingInvitesCount}</span>
            )}
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'owners' ? 'active' : ''}`}
            onClick={() => setActiveTab('owners')}
          >
            <i className="bi bi-people me-1"></i>
            My Owners ({owners.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'assets' ? 'active' : ''}`}
            onClick={() => setActiveTab('assets')}
          >
            <i className="bi bi-archive me-1"></i>
            Assigned Assets ({assignedAssets.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            <i className="bi bi-journal-text me-1"></i>
            My Requests &amp; Status ({claims.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'authorized' ? 'active' : ''}`}
            onClick={() => setActiveTab('authorized')}
          >
            <i className="bi bi-unlock-fill me-1"></i>
            Authorized Documents ({authorizedAssets.length})
          </button>
        </li>
      </ul>

      {/* Tab 1: My Invitations */}
      {activeTab === 'invitations' && (
        <div className="card shadow-sm border-0">
          <div className="card-header bg-white py-3 border-bottom">
            <h5 className="mb-0 fw-bold text-dark">
              <i className="bi bi-envelope-paper-heart text-primary me-2"></i>
              My Invitations
            </h5>
            <small className="text-muted">Estate owners who have nominated you as a beneficiary</small>
          </div>
          <div className="card-body p-0">
            {loading ? (
              <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>
            ) : invitations.length === 0 ? (
              <div className="text-center p-5 text-muted">
                <i className="bi bi-envelope-check fs-1 text-secondary mb-2 d-block"></i>
                No pending or past invitations found. When an estate owner nominates you, their invitation will appear here.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Owner Name</th>
                      <th>Owner Email</th>
                      <th>Your Relationship</th>
                      <th>Status</th>
                      <th className="text-end px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invitations.map(inv => {
                      const inviteId = inv.id || inv.beneficiaryId;
                      return (
                        <tr key={inviteId || inv.ownerId}>
                          <td className="fw-bold">{inv.ownerName}</td>
                          <td className="text-muted">{inv.ownerEmail}</td>
                          <td><span className="badge bg-light text-dark border">{inv.relationship}</span></td>
                          <td>
                            {inv.invitationStatus === 'ACCEPTED' ? (
                              <span className="badge bg-success"><i className="bi bi-check-circle me-1"></i>Accepted</span>
                            ) : inv.invitationStatus === 'DECLINED' ? (
                              <span className="badge bg-danger"><i className="bi bi-x-circle me-1"></i>Declined</span>
                            ) : (
                              <span className="badge bg-warning text-dark"><i className="bi bi-clock me-1"></i>Pending Acceptance</span>
                            )}
                          </td>
                          <td className="text-end px-4">
                            {inv.invitationStatus === 'PENDING' ? (
                              <div className="btn-group btn-group-sm">
                                <button
                                  className="btn btn-success"
                                  onClick={() => handleAcceptInvite(inviteId, inv.ownerName)}
                                  disabled={!inviteId}
                                >
                                  <i className="bi bi-check-lg me-1"></i>Accept
                                </button>
                                <button
                                  className="btn btn-outline-danger"
                                  onClick={() => handleDeclineInvite(inviteId, inv.ownerName)}
                                  disabled={!inviteId}
                                >
                                  <i className="bi bi-x-lg me-1"></i>Decline
                                </button>
                              </div>
                            ) : (
                              <span className="text-muted small">Responded</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: My Owners */}
      {activeTab === 'owners' && (
        <div className="card shadow-sm border-0">
          <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
            <div>
              <h5 className="mb-0 fw-bold text-dark">
                <i className="bi bi-people-fill text-primary me-2"></i>
                My Estate Owners
              </h5>
              <small className="text-muted">Owners who have designated you to inherit digital assets</small>
            </div>
            <button className="btn btn-outline-primary btn-sm" onClick={() => openClaimModal()}>
              <i className="bi bi-shield-plus me-1"></i>Request Access for Owner
            </button>
          </div>
          <div className="card-body p-4">
            {loading ? (
              <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>
            ) : owners.length === 0 ? (
              <div className="text-center p-5 text-muted">
                <i className="bi bi-person-x fs-1 text-secondary mb-2 d-block"></i>
                You do not have any confirmed owner relationships yet.<br />
                Accept an invitation from the <strong>"My Invitations"</strong> tab above to confirm.
              </div>
            ) : (
              <div className="row g-3">
                {owners.map(o => (
                  <div key={o.ownerId} className="col-md-6 col-lg-4">
                    <div className="card h-100 border shadow-sm">
                      <div className="card-body">
                        <div className="d-flex align-items-center mb-3">
                          <div className="rounded-circle bg-primary bg-opacity-10 text-primary p-3 me-3">
                            <i className="bi bi-person-badge fs-4"></i>
                          </div>
                          <div>
                            <h6 className="fw-bold mb-0 text-dark">{o.ownerFullName}</h6>
                            <small className="text-muted">{o.ownerEmail}</small>
                          </div>
                        </div>

                        <div className="mb-2">
                          <span className="text-muted small">Relationship: </span>
                          <span className="badge bg-light text-dark border">{o.relationship}</span>
                        </div>

                        <div className="mb-2">
                          <span className="text-muted small">Assigned Assets: </span>
                          <span className="fw-semibold text-primary">{o.assignedAssetsCount} item(s)</span>
                        </div>

                        <div className="mb-3">
                          <span className="text-muted small">Access Status: </span>
                          {o.hasApprovedClaim ? (
                            <span className="badge bg-success ms-1"><i className="bi bi-unlock me-1"></i>Access Approved</span>
                          ) : (
                            <span className="badge bg-secondary ms-1"><i className="bi bi-lock me-1"></i>Locked (Verification Required)</span>
                          )}
                        </div>

                        <button
                          className="btn btn-outline-primary btn-sm w-100"
                          onClick={() => openClaimModal(o.ownerId)}
                        >
                          <i className="bi bi-file-earmark-medical me-1"></i>
                          Submit Inheritance Claim
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Assigned Assets */}
      {activeTab === 'assets' && (
        <div className="card shadow-sm border-0">
          <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
            <div>
              <h5 className="mb-0 fw-bold text-dark">
                <i className="bi bi-archive-fill text-primary me-2"></i>
                Assigned Digital Assets
              </h5>
              <small className="text-muted">Digital assets allocated to you by estate owners</small>
            </div>
            <button className="btn btn-outline-primary btn-sm" onClick={() => openClaimModal()}>
              <i className="bi bi-shield-plus me-1"></i>Request Inheritance Access
            </button>
          </div>
          <div className="card-body p-0">
            {loading ? (
              <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>
            ) : assignedAssets.length === 0 ? (
              <div className="text-center p-5 text-muted">
                <i className="bi bi-box2 fs-1 text-secondary mb-2 d-block"></i>
                No digital assets have been assigned to you yet.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Asset Name</th>
                      <th>Category</th>
                      <th>Owner</th>
                      <th>Permissions</th>
                      <th>Vault Status</th>
                      <th className="text-end px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignedAssets.map(asset => (
                      <tr key={asset.id}>
                        <td>
                          <div className="fw-bold">{asset.assetName}</div>
                          <small className="text-muted">{asset.description || 'No description'}</small>
                        </td>
                        <td><span className="badge bg-light text-dark border">{asset.categoryName}</span></td>
                        <td className="text-muted">{asset.ownerName}</td>
                        <td>
                          {asset.permissions && asset.permissions.length > 0 ? (
                            asset.permissions.map((p, i) => (
                              <span key={i} className="badge bg-info bg-opacity-10 text-dark me-1 border">{p}</span>
                            ))
                          ) : (
                            <span className="badge bg-secondary">VIEW</span>
                          )}
                        </td>
                        <td>
                          {asset.canViewSecret ? (
                            <span className="badge bg-success"><i className="bi bi-unlock me-1"></i>Unlocked</span>
                          ) : (
                            <span className="badge bg-secondary"><i className="bi bi-lock me-1"></i>Locked</span>
                          )}
                        </td>
                        <td className="text-end px-4">
                          <button
                            className="btn btn-outline-info btn-sm me-1"
                            onClick={() => openInspectModal(asset)}
                          >
                            <i className="bi bi-eye me-1"></i>View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: My Requests & Request Status */}
      {activeTab === 'requests' && (
        <div className="card shadow-sm border-0">
          <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
            <div>
              <h5 className="mb-0 fw-bold text-dark">
                <i className="bi bi-journal-check text-primary me-2"></i>
                My Inheritance Access Requests
              </h5>
              <small className="text-muted">Track the verification status of claims submitted to licensed verifiers</small>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => openClaimModal()}>
              <i className="bi bi-plus-lg me-1"></i>New Claim
            </button>
          </div>
          <div className="card-body p-0">
            {loading ? (
              <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>
            ) : claims.length === 0 ? (
              <div className="text-center p-5 text-muted">
                <i className="bi bi-file-earmark-text fs-1 text-secondary mb-2 d-block"></i>
                You haven&apos;t filed any inheritance access requests yet.<br />
                Click <strong>"New Claim"</strong> above to request access to an owner&apos;s estate.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Request ID</th>
                      <th>Owner</th>
                      <th>Case Type</th>
                      <th>Reason</th>
                      <th>Supporting Document</th>
                      <th>Submission Date</th>
                      <th>Status</th>
                      <th>Verifier Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {claims.map(claim => (
                      <tr key={claim.id}>
                        <td className="fw-bold">#{claim.id}</td>
                        <td>
                          <div className="fw-semibold">{claim.ownerName}</div>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border">
                            {claim.claimType === 'DEATH_VERIFICATION' ? 'Death Verification' : 'Incapacity Verification'}
                          </span>
                        </td>
                        <td className="small" style={{ maxWidth: '220px' }}>{claim.reason}</td>
                        <td>
                          {claim.evidenceFileName ? (
                            <span className="badge bg-secondary bg-opacity-10 text-secondary border">
                              <i className="bi bi-paperclip me-1"></i>
                              {claim.evidenceFileName}
                            </span>
                          ) : (
                            <span className="text-muted small">None attached</span>
                          )}
                        </td>
                        <td className="text-muted small">
                          {claim.createdAt ? new Date(claim.createdAt).toLocaleDateString() : '-'}
                        </td>
                        <td>{requestStatusBadge(claim.status)}</td>
                        <td className="small text-secondary">
                          {claim.verificationNotes || claim.rejectionReason || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Authorized Documents */}
      {activeTab === 'authorized' && (
        <div className="card shadow-sm border-0">
          <div className="card-header bg-white py-3 border-bottom">
            <h5 className="mb-0 fw-bold text-success">
              <i className="bi bi-shield-check me-2"></i>
              Authorized Documents &amp; Inherited Credentials
            </h5>
            <small className="text-muted">
              Assets and private files officially authorized by the estate owner and approved through inheritance verification.
            </small>
          </div>
          <div className="card-body p-4">
            {loading ? (
              <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>
            ) : authorizedAssets.length === 0 ? (
              <div className="text-center p-5 text-muted">
                <i className="bi bi-lock-fill fs-1 text-secondary mb-2 d-block"></i>
                No authorized documents are currently accessible.<br />
                Documents become available once your inheritance claim is <strong>APPROVED</strong> by a verifier.
              </div>
            ) : (
              <div className="row g-4">
                {authorizedAssets.map(asset => {
                  const isSecretShown = revealedSecrets[asset.id];
                  return (
                    <div key={asset.id} className="col-md-6">
                      <div className="card border-success border-2 shadow-sm h-100">
                        <div className="card-header bg-success bg-opacity-10 border-success d-flex justify-content-between align-items-center">
                          <h6 className="fw-bold text-success mb-0">
                            <i className="bi bi-unlock-fill me-2"></i>
                            {asset.assetName}
                          </h6>
                          <span className="badge bg-success">Verified Access</span>
                        </div>
                        <div className="card-body">
                          <div className="mb-2">
                            <span className="text-muted small">Owner: </span>
                            <span className="fw-semibold">{asset.ownerName}</span>
                          </div>
                          <div className="mb-2">
                            <span className="text-muted small">Category: </span>
                            <span className="badge bg-light text-dark border">{asset.categoryName}</span>
                          </div>
                          {asset.description && (
                            <div className="mb-3 small text-muted">{asset.description}</div>
                          )}

                          {/* Secret Identifier / Password */}
                          <div className="p-3 bg-light rounded border mb-3">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <label className="fw-bold small text-muted text-uppercase mb-0">
                                Secret Credential / Identifier:
                              </label>
                              <button
                                className="btn btn-link btn-sm text-decoration-none p-0"
                                onClick={() => toggleSecret(asset.id)}
                              >
                                <i className={`bi ${isSecretShown ? 'bi-eye-slash' : 'bi-eye'} me-1`}></i>
                                {isSecretShown ? 'Hide' : 'Reveal'}
                              </button>
                            </div>
                            <div className="font-monospace fw-bold text-dark">
                              {isSecretShown ? asset.assetIdentifier : '••••••••••••••••'}
                            </div>
                          </div>

                          {/* Attached Files */}
                          {asset.files && asset.files.length > 0 && (
                            <div>
                              <label className="fw-bold small text-muted text-uppercase mb-2">
                                Authorized Attachments:
                              </label>
                              <div className="d-flex flex-column gap-2">
                                {asset.files.map(f => (
                                  <div
                                    key={f.id}
                                    className="d-flex justify-content-between align-items-center p-2 rounded border bg-white"
                                  >
                                    <div className="text-truncate me-2">
                                      <i className="bi bi-file-earmark-text text-primary me-2"></i>
                                      <span className="small fw-semibold">{f.fileName || f.originalFileName}</span>
                                    </div>
                                    <button
                                      className="btn btn-outline-success btn-sm"
                                      onClick={() => handleDownloadFile(asset.id, f.id, f.fileName || f.originalFileName)}
                                      disabled={downloadingFileId === f.id}
                                    >
                                      {downloadingFileId === f.id ? (
                                        <span className="spinner-border spinner-border-sm"></span>
                                      ) : (
                                        <><i className="bi bi-download me-1"></i>Download</>
                                      )}
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Claim Submission Modal */}
      {showClaimModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} tabIndex="-1">
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-dark text-white py-3">
                <h5 className="modal-title">
                  <i className="bi bi-shield-lock-fill text-warning me-2"></i>
                  Request Inheritance Access
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowClaimModal(false)}></button>
              </div>
              <form onSubmit={handleClaimSubmit}>
                <div className="modal-body p-4">
                  <div className="alert alert-info py-2 px-3 small border-0 mb-3 bg-info bg-opacity-10 text-dark">
                    <i className="bi bi-info-circle-fill text-info me-2"></i>
                    Your inheritance access claim will be reviewed by an authorized verifier. Access is granted strictly to the assets designated by the owner upon verification.
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Select Estate Owner *</label>
                    <select
                      className="form-select"
                      value={claimOwnerId}
                      onChange={e => setClaimOwnerId(e.target.value)}
                      required
                    >
                      <option value="">-- Choose Owner Profile --</option>
                      {owners.map(o => (
                        <option key={o.ownerId} value={o.ownerId}>
                          {o.ownerFullName} ({o.ownerEmail}) - Relationship: {o.relationship}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Verification Case Type *</label>
                    <div className="row g-2">
                      <div className="col-md-6">
                        <div
                          className={`p-3 border rounded cursor-pointer ${
                            claimType === 'DEATH_VERIFICATION' ? 'border-primary bg-primary bg-opacity-10' : 'bg-white'
                          }`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => setClaimType('DEATH_VERIFICATION')}
                        >
                          <div className="form-check">
                            <input
                              type="radio"
                              name="claimType"
                              className="form-check-input"
                              checked={claimType === 'DEATH_VERIFICATION'}
                              onChange={() => setClaimType('DEATH_VERIFICATION')}
                              id="deathClaim"
                            />
                            <label className="form-check-label fw-bold text-dark" htmlFor="deathClaim">
                              Death Verification
                            </label>
                          </div>
                          <small className="text-muted d-block mt-1">
                            Requires death certificate or official obituary confirmation.
                          </small>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div
                          className={`p-3 border rounded cursor-pointer ${
                            claimType === 'INCAPACITY_VERIFICATION' ? 'border-primary bg-primary bg-opacity-10' : 'bg-white'
                          }`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => setClaimType('INCAPACITY_VERIFICATION')}
                        >
                          <div className="form-check">
                            <input
                              type="radio"
                              name="claimType"
                              className="form-check-input"
                              checked={claimType === 'INCAPACITY_VERIFICATION'}
                              onChange={() => setClaimType('INCAPACITY_VERIFICATION')}
                              id="incapacityClaim"
                            />
                            <label className="form-check-label fw-bold text-dark" htmlFor="incapacityClaim">
                              Incapacity Verification
                            </label>
                          </div>
                          <small className="text-muted d-block mt-1">
                            Requires medical documentation or power of attorney legal authorization.
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Reason for Requesting Access *</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      required
                      placeholder="Please explain the circumstances requiring inheritance access..."
                      value={claimReason}
                      onChange={e => setClaimReason(e.target.value)}
                    ></textarea>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Supporting Documents (Death Certificate / Medical / Legal Authorization)
                    </label>
                    <input
                      type="file"
                      className="form-control"
                      onChange={e => setSupportingFile(e.target.files[0])}
                    />
                    <small className="text-muted">
                      Accepted formats: PDF, JPG, PNG, DOCX (Max 10MB). Securely stored for verifier review only.
                    </small>
                  </div>
                </div>
                <div className="modal-footer bg-light py-2">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowClaimModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submittingClaim || uploadingDoc}>
                    {submittingClaim || uploadingDoc ? (
                      <><span className="spinner-border spinner-border-sm me-2"></span>Submitting Claim...</>
                    ) : (
                      'Submit Inheritance Request'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Asset Inspection Modal */}
      {showDetailModal && selectedAsset && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-dark text-white py-3">
                <h5 className="modal-title">
                  <i className="bi bi-archive me-2 text-primary"></i>
                  {selectedAsset.assetName}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowDetailModal(false)}></button>
              </div>
              <div className="modal-body p-4">
                <div className="mb-3">
                  <label className="text-muted small text-uppercase fw-semibold">Category</label>
                  <div><span className="badge bg-light text-dark border">{selectedAsset.categoryName}</span></div>
                </div>
                <div className="mb-3">
                  <label className="text-muted small text-uppercase fw-semibold">Owner</label>
                  <div className="fw-semibold">{selectedAsset.ownerName}</div>
                </div>
                <div className="mb-3">
                  <label className="text-muted small text-uppercase fw-semibold">Vault Security Status</label>
                  <div>
                    {selectedAsset.canViewSecret ? (
                      <span className="badge bg-success"><i className="bi bi-unlock me-1"></i>Unlocked &amp; Authorized</span>
                    ) : (
                      <span className="badge bg-secondary"><i className="bi bi-lock me-1"></i>Locked (Approval Required)</span>
                    )}
                  </div>
                </div>
                <div className="mb-3">
                  <label className="text-muted small text-uppercase fw-semibold">Credential / Identifier</label>
                  <div className="p-2 bg-light rounded border font-monospace">
                    {selectedAsset.canViewSecret ? selectedAsset.assetIdentifier : '•••••••••••••••• (Locked)'}
                  </div>
                </div>
              </div>
              <div className="modal-footer bg-light py-2">
                <button type="button" className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>
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
