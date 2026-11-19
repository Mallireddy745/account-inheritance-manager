import React, { useEffect, useState } from 'react';
import {
  getBeneficiaries,
  createBeneficiary,
  updateBeneficiary,
  deleteBeneficiary,
  resendInvitation,
  getBeneficiaryRequests
} from '../../api/beneficiaryService';
import {
  getAssets,
  uploadAssetFile,
  deleteAssetFile,
  previewAssetFile
} from '../../api/assetService';
import { toast } from 'react-toastify';
import { formatApiError } from '../../utils/errorHandler';

export default function Beneficiaries() {
  const [list, setList] = useState([]);
  const [availableAssets, setAvailableAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [requestsBeneficiary, setRequestsBeneficiary] = useState(null);
  const [beneficiaryRequests, setBeneficiaryRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resendingId, setResendingId] = useState(null);

  // SecurityLocker Secure Document Viewer State
  const [watchingFile, setWatchingFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewContentType, setPreviewContentType] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewTextContent, setPreviewTextContent] = useState('');

  // Asset Document Management inside Beneficiary view
  const [assetFileInputs, setAssetFileInputs] = useState({});
  const [uploadingAssetId, setUploadingAssetId] = useState(null);

  // Form State
  const initialForm = {
    fullName: '',
    email: '',
    phoneNumber: '',
    relationship: '',
    address: '',
    assignedAssetIds: [],
    permissionType: 'VIEW',
    allocationPercentage: 100
  };
  const [form, setForm] = useState(initialForm);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [benRes, assetRes] = await Promise.all([
        getBeneficiaries(),
        getAssets({ size: 100 })
      ]);
      const d = benRes.data.data;
      setList(Array.isArray(d) ? d : (d.content || []));

      const a = assetRes.data.data;
      setAvailableAssets(Array.isArray(a) ? a : (a.content || []));
    } catch {
      toast.error('Failed to load beneficiaries or assets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleWatchFile = async (assetId, file) => {
    setWatchingFile(file);
    setLoadingPreview(true);
    setPreviewUrl(null);
    setPreviewTextContent('');
    try {
      const res = await previewAssetFile(assetId, file.id, file.fileName);
      setPreviewUrl(res.url);
      setPreviewContentType(res.contentType);
      if (res.contentType.includes('text') || file.fileName.toLowerCase().endsWith('.txt')) {
        const text = await res.blob.text();
        setPreviewTextContent(text);
      }
    } catch (err) {
      console.error('SecurityLocker preview error:', err);
      toast.error('Failed to preview document in SecurityLocker viewer');
      setWatchingFile(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  const closeWatchModal = () => {
    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl);
    }
    setWatchingFile(null);
    setPreviewUrl(null);
    setPreviewTextContent('');
  };

  const handleDeleteAssetFile = async (assetId, fileId, fileName) => {
    if (!window.confirm(`Are you sure you want to remove "${fileName}" from this asset? It will be removed from this beneficiary's documents.`)) {
      return;
    }
    try {
      await deleteAssetFile(assetId, fileId);
      toast.success(`Removed "${fileName}" successfully`);
      await fetchData();
      if (detailItem) {
        const res = await getBeneficiaries();
        const updatedList = Array.isArray(res.data.data) ? res.data.data : (res.data.data?.content || []);
        const found = updatedList.find(b => b.id === detailItem.id);
        if (found) setDetailItem(found);
      }
    } catch {
      toast.error('Failed to remove document');
    }
  };

  const handleUploadAssetDoc = async (assetId) => {
    const file = assetFileInputs[assetId];
    if (!file) {
      toast.warning('Please select a file to upload');
      return;
    }
    setUploadingAssetId(assetId);
    try {
      await uploadAssetFile(assetId, file);
      toast.success(`Attached "${file.name}" to asset documents (AES-256 encrypted)`);
      setAssetFileInputs(prev => ({ ...prev, [assetId]: null }));
      await fetchData();
      if (detailItem) {
        const res = await getBeneficiaries();
        const updatedList = Array.isArray(res.data.data) ? res.data.data : (res.data.data?.content || []);
        const found = updatedList.find(b => b.id === detailItem.id);
        if (found) setDetailItem(found);
      }
    } catch {
      toast.error('Failed to upload document');
    } finally {
      setUploadingAssetId(null);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(initialForm);
    setShowModal(true);
  };

  const openEdit = (b) => {
    setEditing(b);
    setForm({
      fullName: b.fullName || '',
      email: b.email || '',
      phoneNumber: b.phoneNumber || '',
      relationship: b.relationship || '',
      address: b.address || '',
      assignedAssetIds: Array.from(new Set((b.assignedAssetIds || []).map(Number))),
      permissionType: (b.permissionTypes && b.permissionTypes.length > 0) ? b.permissionTypes[0] : 'VIEW',
      allocationPercentage: b.allocationPercentage != null ? b.allocationPercentage : 100
    });
    setShowModal(true);
  };

  const openDetail = (b) => {
    setDetailItem(b);
    setShowDetailModal(true);
  };

  const openRequests = async (b) => {
    setRequestsBeneficiary(b);
    setShowRequestsModal(true);
    setLoadingRequests(true);
    try {
      const res = await getBeneficiaryRequests(b.id, { page: 0, size: 20 });
      setBeneficiaryRequests(res.data.data?.content || []);
    } catch {
      toast.error('Failed to load inheritance requests for this beneficiary');
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleResend = async (id, name) => {
    setResendingId(id);
    try {
      await resendInvitation(id);
      toast.success(`Invitation resent to ${name}`);
      fetchData();
    } catch (err) {
      toast.error(formatApiError(err, 'Failed to resend invitation'));
    } finally {
      setResendingId(null);
    }
  };

  const toggleAssetSelection = (assetId) => {
    const id = Number(assetId);
    setForm(prev => {
      const current = prev.assignedAssetIds.map(Number);
      const exists = current.includes(id);
      const updated = exists
        ? current.filter(x => x !== id)
        : [...current, id];
      return { ...prev, assignedAssetIds: Array.from(new Set(updated)) };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const name = form.fullName.trim();
    const email = form.email.trim();
    const rel = form.relationship.trim();

    if (!name || name.length < 2) {
      toast.warning('Full name must be at least 2 characters long');
      return;
    }
    if (!email) {
      toast.warning('Email address is required');
      return;
    }
    if (!rel) {
      toast.warning('Relationship is required (e.g. Spouse, Son, Daughter, Attorney)');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        fullName: name,
        email: email.toLowerCase(),
        phoneNumber: form.phoneNumber ? form.phoneNumber.trim() : null,
        relationship: rel,
        address: form.address ? form.address.trim() : null,
        assignedAssetIds: Array.from(new Set((form.assignedAssetIds || []).map(Number))),
        permissionType: form.permissionType,
        allocationPercentage: parseFloat(form.allocationPercentage) || 100
      };

      if (editing) {
        await updateBeneficiary(editing.id, payload);
        toast.success('Beneficiary updated and asset permissions saved');
      } else {
        await createBeneficiary(payload);
        toast.success('Beneficiary added! Invitation registered.');
      }

      setShowModal(false);
      setForm(initialForm);
      fetchData();
    } catch (err) {
      toast.error(formatApiError(err, 'Operation failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove beneficiary "${name}"? This will revoke their assigned inheritance access.`)) return;
    try {
      await deleteBeneficiary(id);
      toast.success('Beneficiary removed');
      fetchData();
      if (detailItem?.id === id) setShowDetailModal(false);
    } catch {
      toast.error('Failed to remove beneficiary');
    }
  };

  const invitationBadge = (status) => {
    switch (status) {
      case 'ACCEPTED':
        return <span className="badge bg-success"><i className="bi bi-check-circle me-1"></i>Accepted</span>;
      case 'DECLINED':
        return <span className="badge bg-danger"><i className="bi bi-x-circle me-1"></i>Declined</span>;
      case 'PENDING':
      default:
        return <span className="badge bg-warning text-dark"><i className="bi bi-clock me-1"></i>Invitation Pending</span>;
    }
  };

  const claimStatusBadge = (s) => {
    const map = {
      PENDING: 'warning text-dark',
      UNDER_REVIEW: 'info text-dark',
      ADDITIONAL_INFORMATION_REQUIRED: 'secondary',
      APPROVED: 'success',
      REJECTED: 'danger'
    };
    return <span className={`badge bg-${map[s] || 'secondary'}`}>{s}</span>;
  };

  const filtered = list.filter(b =>
    (b.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
    (b.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (b.relationship || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-0 text-dark">My Beneficiaries</h4>
          <small className="text-muted">Manage designated heirs, assign digital assets with permissions, and track inheritance requests</small>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <i className="bi bi-person-plus-fill me-1"></i>Add Beneficiary
        </button>
      </div>

      {/* Info Notice */}
      <div className="alert alert-light border shadow-sm mb-4">
        <div className="d-flex align-items-center">
          <i className="bi bi-shield-check text-primary fs-4 me-3"></i>
          <div>
            <div className="fw-semibold text-dark">Password-Free Independent Beneficiary Model</div>
            <div className="small text-muted">
              Nominated beneficiaries register with their own independent credentials. They will never need or receive your password. Private assets and sensitive credentials remain securely locked until an inheritance claim is verified and approved.
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <div className="input-group">
            <span className="input-group-text bg-white"><i className="bi bi-search"></i></span>
            <input
              type="text"
              className="form-control"
              placeholder="Search beneficiaries by name, email, or relationship..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Beneficiaries Table */}
      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>
          ) : filtered.length === 0 ? (
            <div className="text-center p-5 text-muted">
              <i className="bi bi-people fs-1 text-secondary mb-2 d-block"></i>
              No beneficiaries designated yet.<br />
              Click <strong>"Add Beneficiary"</strong> above to nominate heirs and assign estate assets.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Beneficiary</th>
                    <th>Relationship</th>
                    <th>Account Status</th>
                    <th>Invitation Status</th>
                    <th>Assigned Assets & Permissions</th>
                    <th className="text-end px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(b => (
                    <tr key={b.id}>
                      <td>
                        <button
                          type="button"
                          className="btn btn-link text-decoration-none fw-semibold p-0 text-dark text-start"
                          onClick={() => openDetail(b)}
                        >
                          {b.fullName}
                        </button>
                        <div className="text-muted small">{b.email}</div>
                        {b.phoneNumber && <div className="text-secondary small">{b.phoneNumber}</div>}
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">{b.relationship}</span>
                      </td>
                      <td>
                        {b.isRegistered ? (
                          <span className="badge bg-success bg-opacity-10 text-success border border-success">
                            <i className="bi bi-person-check me-1"></i>Registered
                          </span>
                        ) : (
                          <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary">
                            <i className="bi bi-person-x me-1"></i>Not Registered
                          </span>
                        )}
                      </td>
                      <td>
                        {invitationBadge(b.invitationStatus)}
                        {b.invitationStatus !== 'ACCEPTED' && (
                          <button
                            className="btn btn-link btn-sm text-decoration-none p-0 d-block mt-1 small"
                            onClick={() => handleResend(b.id, b.fullName)}
                            disabled={resendingId === b.id}
                          >
                            {resendingId === b.id ? 'Sending...' : 'Resend Invite'}
                          </button>
                        )}
                      </td>
                      <td>
                        {b.assignedAssetNames && b.assignedAssetNames.length > 0 ? (
                          <div>
                            <div className="small fw-semibold text-primary mb-1">
                              {b.assignedAssetNames.length} Asset(s) Assigned
                            </div>
                            <div className="d-flex flex-wrap gap-1">
                              {b.assignedAssetNames.slice(0, 3).map((name, i) => (
                                <span key={i} className="badge bg-primary bg-opacity-10 text-primary border">
                                  {name}
                                </span>
                              ))}
                              {b.assignedAssetNames.length > 3 && (
                                <span className="badge bg-light text-muted border">+{b.assignedAssetNames.length - 3} more</span>
                              )}
                            </div>
                            {b.permissionTypes && b.permissionTypes.length > 0 && (
                              <div className="text-muted small mt-1">
                                Permissions: <span className="fw-semibold">{b.permissionTypes.join(', ')}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted small fst-italic">No assets assigned</span>
                        )}
                      </td>
                      <td className="text-end px-4">
                        <div className="btn-group btn-group-sm">
                          <button
                            type="button"
                            className="btn btn-outline-info"
                            onClick={() => openDetail(b)}
                            title="View Beneficiary Details"
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-warning"
                            onClick={() => openRequests(b)}
                            title="View Inheritance Requests"
                          >
                            <i className="bi bi-journal-check"></i>
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-primary"
                            onClick={() => openEdit(b)}
                            title="Edit & Assign Assets"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            onClick={() => handleDelete(b.id, b.fullName)}
                            title="Remove Beneficiary"
                          >
                            <i className="bi bi-trash"></i>
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
      </div>

      {/* Inheritance Requests Modal */}
      {showRequestsModal && requestsBeneficiary && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} tabIndex="-1">
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-dark text-white py-3">
                <h5 className="modal-title">
                  <i className="bi bi-journal-text me-2 text-warning"></i>
                  Inheritance Requests: {requestsBeneficiary.fullName}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowRequestsModal(false)}></button>
              </div>
              <div className="modal-body p-4">
                {loadingRequests ? (
                  <div className="text-center py-4"><div className="spinner-border text-primary"></div></div>
                ) : beneficiaryRequests.length === 0 ? (
                  <div className="text-center py-4 text-muted">
                    <i className="bi bi-check2-circle fs-2 text-success mb-2 d-block"></i>
                    No inheritance access claims or requests have been filed by this beneficiary yet.
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-bordered align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Request ID</th>
                          <th>Claim Type</th>
                          <th>Status</th>
                          <th>Reason</th>
                          <th>Submitted Date</th>
                          <th>Verifier Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {beneficiaryRequests.map(r => (
                          <tr key={r.id}>
                            <td className="fw-bold">#{r.id}</td>
                            <td>
                              <span className="badge bg-light text-dark border">
                                {r.claimType === 'DEATH_VERIFICATION' ? 'Death Verification' : 'Incapacity Verification'}
                              </span>
                            </td>
                            <td>{claimStatusBadge(r.status)}</td>
                            <td className="small" style={{ maxWidth: '200px' }}>{r.reason}</td>
                            <td className="small text-muted">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '-'}</td>
                            <td className="small text-secondary">{r.verificationNotes || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="modal-footer bg-light py-2">
                <button type="button" className="btn btn-secondary" onClick={() => setShowRequestsModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && detailItem && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-primary text-white py-3">
                <h5 className="modal-title">
                  <i className="bi bi-person-badge me-2"></i>
                  Beneficiary: {detailItem.fullName}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowDetailModal(false)}></button>
              </div>
              <div className="modal-body p-4">
                <div className="row g-3">
                  <div className="col-6">
                    <label className="text-muted small text-uppercase fw-semibold">Relationship</label>
                    <div className="fs-6 fw-bold">{detailItem.relationship}</div>
                  </div>
                  <div className="col-6">
                    <label className="text-muted small text-uppercase fw-semibold">Invitation</label>
                    <div>{invitationBadge(detailItem.invitationStatus)}</div>
                  </div>
                  <div className="col-12">
                    <label className="text-muted small text-uppercase fw-semibold">Email Address</label>
                    <div>{detailItem.email}</div>
                  </div>
                  <div className="col-6">
                    <label className="text-muted small text-uppercase fw-semibold">Phone</label>
                    <div>{detailItem.phoneNumber || 'Not provided'}</div>
                  </div>
                  <div className="col-6">
                    <label className="text-muted small text-uppercase fw-semibold">Account Status</label>
                    <div>
                      {detailItem.isRegistered ? (
                        <span className="badge bg-success">Registered User</span>
                      ) : (
                        <span className="badge bg-secondary">Awaiting Registration</span>
                      )}
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <label className="text-muted small text-uppercase fw-semibold mb-0">
                        <i className="bi bi-folder2-open text-primary me-1"></i>
                        Assigned Assets &amp; Beneficiary Documents
                      </label>
                      <span className="badge bg-success bg-opacity-10 text-success border border-success small">
                        <i className="bi bi-shield-check me-1"></i>SecurityLocker View
                      </span>
                    </div>

                    {availableAssets.filter(a => (detailItem.assignedAssetIds || []).includes(a.id)).length > 0 ? (
                      <div className="d-flex flex-column gap-3">
                        {availableAssets.filter(a => (detailItem.assignedAssetIds || []).includes(a.id)).map(asset => (
                          <div key={asset.id} className="p-3 border rounded bg-white shadow-sm">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <div>
                                <strong className="text-dark">{asset.name || asset.assetName}</strong>
                                <span className="badge bg-light text-secondary border ms-2">
                                  {asset.categoryName || 'General'}
                                </span>
                              </div>
                            </div>

                            {/* Documents list */}
                            <div className="mb-2">
                              <small className="text-muted fw-semibold d-block mb-1">
                                Attached Documents ({asset.files?.length || 0}):
                              </small>
                              {asset.files && asset.files.length > 0 ? (
                                <div className="list-group list-group-flush border rounded">
                                  {asset.files.map(f => (
                                    <div key={f.id} className="list-group-item d-flex justify-content-between align-items-center py-2 px-3">
                                      <div className="d-flex align-items-center gap-2">
                                        <i className="bi bi-file-earmark-check-fill text-success"></i>
                                        <div>
                                          <div className="small fw-semibold text-dark text-truncate" style={{ maxWidth: '280px' }}>
                                            {f.fileName}
                                          </div>
                                          <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                                            {(f.fileSize / 1024).toFixed(0)} KB &bull; Encrypted Vault File
                                          </div>
                                        </div>
                                      </div>
                                      <div className="d-flex align-items-center gap-1">
                                        <button
                                          type="button"
                                          className="btn btn-outline-success btn-sm py-1 px-2 d-inline-flex align-items-center gap-1"
                                          onClick={() => handleWatchFile(asset.id, f)}
                                          title="Watch document without downloading (SecurityLocker view)"
                                        >
                                          <i className="bi bi-eye"></i> Watch
                                        </button>
                                        <button
                                          type="button"
                                          className="btn btn-outline-danger btn-sm py-1 px-2 d-inline-flex align-items-center gap-1"
                                          onClick={() => handleDeleteAssetFile(asset.id, f.id, f.fileName)}
                                          title="Remove this document from beneficiary access"
                                        >
                                          <i className="bi bi-trash"></i>
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-muted small fst-italic py-1">
                                  No supporting documents attached to this asset yet.
                                </div>
                              )}
                            </div>

                            {/* Upload new document to this asset */}
                            <div className="input-group input-group-sm mt-2">
                              <input
                                type="file"
                                className="form-control"
                                onChange={e => setAssetFileInputs(prev => ({ ...prev, [asset.id]: e.target.files[0] }))}
                              />
                              <button
                                type="button"
                                className="btn btn-outline-primary"
                                disabled={!assetFileInputs[asset.id] || uploadingAssetId === asset.id}
                                onClick={() => handleUploadAssetDoc(asset.id)}
                              >
                                {uploadingAssetId === asset.id ? (
                                  <span className="spinner-border spinner-border-sm"></span>
                                ) : (
                                  <><i className="bi bi-cloud-arrow-up me-1"></i>Attach Document</>
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 border rounded bg-light text-muted small text-center">
                        {detailItem.assignedAssetNames && detailItem.assignedAssetNames.length > 0 ? (
                          <div className="d-flex flex-wrap gap-1">
                            {detailItem.assignedAssetNames.map((n, i) => (
                              <span key={i} className="badge bg-primary bg-opacity-10 text-primary border">{n}</span>
                            ))}
                          </div>
                        ) : (
                          'No digital assets currently assigned to this beneficiary.'
                        )}
                      </div>
                    )}
                  </div>
                  {detailItem.address && (
                    <div className="col-12">
                      <label className="text-muted small text-uppercase fw-semibold">Address</label>
                      <div className="small">{detailItem.address}</div>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer bg-light py-2">
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={() => {
                    setShowDetailModal(false);
                    openEdit(detailItem);
                  }}
                >
                  <i className="bi bi-pencil me-1"></i>Edit & Assign
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Beneficiary Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} tabIndex="-1">
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-dark text-white py-3">
                <h5 className="modal-title">
                  <i className="bi bi-person-fill me-2 text-primary"></i>
                  {editing ? 'Edit Beneficiary & Asset Access' : 'Add New Beneficiary'}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Full Legal Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        placeholder="e.g. Priya Sharma"
                        value={form.fullName}
                        onChange={e => setForm({ ...form, fullName: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Email Address *</label>
                      <input
                        type="email"
                        className="form-control"
                        required
                        placeholder="e.g. priya.sharma@example.com"
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                      />
                      <small className="text-muted">Invitation will be linked to this email address.</small>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Phone Number</label>
                      <input
                        type="tel"
                        className="form-control"
                        placeholder="e.g. +1 555-0199"
                        value={form.phoneNumber}
                        onChange={e => setForm({ ...form, phoneNumber: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Relationship to You *</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        placeholder="e.g. Daughter, Spouse, Son, Attorney"
                        value={form.relationship}
                        onChange={e => setForm({ ...form, relationship: e.target.value })}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-semibold">Residential / Contact Address</label>
                      <textarea
                        className="form-control"
                        rows="2"
                        placeholder="Street, City, State, PIN/ZIP..."
                        value={form.address}
                        onChange={e => setForm({ ...form, address: e.target.value })}
                      ></textarea>
                    </div>
                  </div>

                  <hr className="my-4" />

                  {/* Asset Assignment & Permission Controls */}
                  <h6 className="fw-bold text-dark mb-2">
                    <i className="bi bi-shield-lock-fill text-primary me-2"></i>
                    Assign Digital Assets & Set Permissions
                  </h6>
                  <p className="text-muted small mb-3">
                    Select which digital assets and documents this beneficiary is authorized to inherit. Documents remain private and locked until an inheritance claim is verified and approved.
                  </p>

                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small">Default Access Permission</label>
                      <select
                        className="form-select"
                        value={form.permissionType}
                        onChange={e => setForm({ ...form, permissionType: e.target.value })}
                      >
                        <option value="VIEW">VIEW - Read-only credentials and documents</option>
                        <option value="DOWNLOAD">DOWNLOAD - Read & Download authorized attachments</option>
                        <option value="TRANSFER">TRANSFER - Full asset transfer rights</option>
                        <option value="EMERGENCY_ACCESS">EMERGENCY_ACCESS - Accelerated emergency claim</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small">Allocation Percentage (%)</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        className="form-control"
                        value={form.allocationPercentage}
                        onChange={e => setForm({ ...form, allocationPercentage: e.target.value })}
                      />
                    </div>
                  </div>

                  <label className="form-label fw-semibold small mb-2">Select Digital Assets to Assign:</label>
                  {availableAssets.length === 0 ? (
                    <div className="p-3 bg-light rounded text-muted small text-center">
                      No assets found in your digital legacy vault. You can add assets later under the <strong>Digital Assets</strong> tab.
                    </div>
                  ) : (
                    <div className="border rounded p-3 bg-light" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      <div className="row g-2">
                        {availableAssets.map(asset => {
                          const isSelected = form.assignedAssetIds.includes(asset.id);
                          return (
                            <div key={asset.id} className="col-md-6">
                              <div
                                className={`p-2 rounded border bg-white d-flex align-items-center cursor-pointer ${
                                  isSelected ? 'border-primary shadow-sm' : ''
                                }`}
                                style={{ cursor: 'pointer' }}
                                onClick={() => toggleAssetSelection(asset.id)}
                              >
                                <input
                                  type="checkbox"
                                  className="form-check-input me-2 mt-0"
                                  checked={isSelected}
                                  onChange={() => {}}
                                />
                                <div className="text-truncate">
                                  <div className="small fw-bold text-dark text-truncate">{asset.name || asset.assetName}</div>
                                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                    {asset.categoryName || 'General'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <small className="text-muted mt-1 d-block">
                    {form.assignedAssetIds.length} asset(s) selected for this beneficiary.
                  </small>

                  {/* Selected Asset Documents Management */}
                  {form.assignedAssetIds.length > 0 && (
                    <div className="mt-3 p-3 border rounded bg-white">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="fw-bold text-dark small mb-0">
                          <i className="bi bi-file-earmark-lock2 text-primary me-1"></i>
                          Manage Documents for Selected Assets ({form.assignedAssetIds.length})
                        </h6>
                        <span className="badge bg-light text-secondary border small">
                          Edit &amp; Remove Files
                        </span>
                      </div>
                      <p className="text-muted small mb-2">
                        Review, remove unwanted files, or upload updated documents for the digital assets assigned to this beneficiary:
                      </p>

                      <div className="d-flex flex-column gap-2" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                        {availableAssets
                          .filter(a => form.assignedAssetIds.includes(a.id))
                          .map(asset => (
                            <div key={asset.id} className="p-2 border rounded bg-light">
                              <div className="d-flex justify-content-between align-items-center mb-1">
                                <span className="fw-semibold small text-dark">{asset.name || asset.assetName}</span>
                                <span className="badge bg-secondary" style={{ fontSize: '0.65rem' }}>{asset.categoryName || 'General'}</span>
                              </div>

                              {/* Files list */}
                              {asset.files && asset.files.length > 0 ? (
                                <div className="list-group list-group-flush mb-2">
                                  {asset.files.map(f => (
                                    <div key={f.id} className="list-group-item d-flex justify-content-between align-items-center py-1 px-2 bg-white rounded border mb-1">
                                      <div className="small text-truncate" style={{ maxWidth: '240px' }}>
                                        <i className="bi bi-file-earmark-check-fill text-success me-1"></i>
                                        {f.fileName}
                                      </div>
                                      <div className="d-flex gap-1">
                                        <button
                                          type="button"
                                          className="btn btn-outline-success btn-sm py-0 px-2"
                                          style={{ fontSize: '0.75rem' }}
                                          onClick={() => handleWatchFile(asset.id, f)}
                                          title="Watch in SecurityLocker secure viewer"
                                        >
                                          <i className="bi bi-eye"></i> Watch
                                        </button>
                                        <button
                                          type="button"
                                          className="btn btn-outline-danger btn-sm py-0 px-2"
                                          style={{ fontSize: '0.75rem' }}
                                          onClick={() => handleDeleteAssetFile(asset.id, f.id, f.fileName)}
                                          title="Remove file from this asset"
                                        >
                                          <i className="bi bi-trash"></i> Remove
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-muted small fst-italic mb-2">No documents currently attached.</div>
                              )}

                              {/* Inline upload to this asset */}
                              <div className="input-group input-group-sm">
                                <input
                                  type="file"
                                  className="form-control"
                                  style={{ fontSize: '0.75rem' }}
                                  onChange={e => setAssetFileInputs(prev => ({ ...prev, [asset.id]: e.target.files[0] }))}
                                />
                                <button
                                  type="button"
                                  className="btn btn-primary"
                                  style={{ fontSize: '0.75rem' }}
                                  disabled={!assetFileInputs[asset.id] || uploadingAssetId === asset.id}
                                  onClick={() => handleUploadAssetDoc(asset.id)}
                                >
                                  {uploadingAssetId === asset.id ? 'Uploading...' : 'Attach File'}
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="modal-footer bg-light py-2">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Saving...' : (editing ? 'Update Beneficiary' : 'Add Beneficiary & Send Invitation')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* SecurityLocker Secure Document Viewer Modal */}
      {watchingFile && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.75)' }} tabIndex="-1">
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
              <div className="modal-header bg-dark text-white py-3">
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-success d-flex align-items-center gap-1 py-2 px-3">
                    <i className="bi bi-shield-check"></i>
                    SecurityLocker Secure Vault View
                  </span>
                  <h5 className="modal-title mb-0 text-truncate" style={{ maxWidth: '450px' }}>
                    {watchingFile.fileName}
                  </h5>
                </div>
                <button type="button" className="btn-close btn-close-white" onClick={closeWatchModal}></button>
              </div>

              <div className="modal-body p-3 bg-light" style={{ overflowY: 'auto' }}>
                {/* Security Notice */}
                <div className="alert alert-light border border-success d-flex align-items-center py-2 px-3 mb-3 shadow-sm">
                  <i className="bi bi-lock-fill text-success fs-4 me-3"></i>
                  <div className="small text-secondary">
                    <strong className="text-dark">SecurityLocker In-App Secure Viewer:</strong> Document decrypted directly in browser memory for live inspection. In accordance with SecurityLocker standards, file downloading to disk is restricted to protect your digital estate privacy.
                  </div>
                </div>

                {loadingPreview ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-success mb-2" role="status"></div>
                    <div className="text-muted small">Decrypting and streaming document in secure memory...</div>
                  </div>
                ) : previewUrl ? (
                  <div className="bg-white rounded border p-2 text-center" style={{ minHeight: '400px' }}>
                    {previewContentType.includes('pdf') || watchingFile.fileName.toLowerCase().endsWith('.pdf') ? (
                      <iframe
                        src={`${previewUrl}#toolbar=0&navpanes=0`}
                        title="SecurityLocker Document Viewer"
                        style={{ width: '100%', height: '600px', border: 'none' }}
                      />
                    ) : previewContentType.includes('image') || /\.(jpg|jpeg|png|gif|webp)$/i.test(watchingFile.fileName) ? (
                      <div className="p-3">
                        <img
                          src={previewUrl}
                          alt={watchingFile.fileName}
                          className="img-fluid rounded shadow-sm"
                          style={{ maxHeight: '600px', objectFit: 'contain' }}
                        />
                      </div>
                    ) : previewTextContent ? (
                      <pre className="p-3 bg-light border rounded text-start font-monospace small" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                        {previewTextContent}
                      </pre>
                    ) : (
                      <div className="py-5 text-center text-muted">
                        <i className="bi bi-file-earmark-check fs-1 text-success d-block mb-2"></i>
                        <h6>{watchingFile.fileName}</h6>
                        <p className="small text-secondary mb-0">
                          This document is securely stored and authenticated in your SecurityLocker estate vault.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="alert alert-danger">Unable to load document stream.</div>
                )}
              </div>

              <div className="modal-footer bg-white py-2 d-flex justify-content-between">
                <div className="text-muted small">
                  <i className="bi bi-shield-shaded text-success me-1"></i>
                  Protected by 256-bit AES-GCM Encryption
                </div>
                <button type="button" className="btn btn-secondary btn-sm" onClick={closeWatchModal}>
                  Close Viewer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
