import React, { useEffect, useState } from 'react';
import {
  getAssets,
  getAsset,
  deleteAsset,
  getCategories,
  createAssetJson,
  updateAsset,
  uploadAssetFile,
  downloadAssetFile,
  deleteAssetFile,
  previewAssetFile
} from '../../api/assetService';
import { getBeneficiaries } from '../../api/beneficiaryService';
import { toast } from 'react-toastify';
import { formatApiError } from '../../utils/errorHandler';

export default function Assets() {
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Modals
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [detailAsset, setDetailAsset] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // File Upload State
  const [formFile, setFormFile] = useState(null);
  const [modalUploadFile, setModalUploadFile] = useState(null);
  const [uploadingModalFile, setUploadingModalFile] = useState(false);
  const [downloadingFileId, setDownloadingFileId] = useState(null);

  // SecurityLocker Secure Document Viewer State
  const [watchingFile, setWatchingFile] = useState(null);
  const [watchingAssetId, setWatchingAssetId] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewContentType, setPreviewContentType] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewTextContent, setPreviewTextContent] = useState('');

  // Form State
  const initialForm = {
    name: '',
    categoryId: '',
    platformName: '',
    assetIdentifier: '',
    description: '',
    transferInstructions: '',
    beneficiaryId: '',
    status: 'ACTIVE'
  };
  const [form, setForm] = useState(initialForm);

  const fetchAssets = () => {
    setLoading(true);
    const params = {};
    if (selectedCategory) params.categoryId = selectedCategory;
    if (search) params.search = search;

    getAssets(params)
      .then(res => {
        const d = res.data.data;
        setAssets(Array.isArray(d) ? d : (d.content || []));
      })
      .catch(() => toast.error('Failed to load estate assets'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAssets();
    getCategories()
      .then(res => setCategories(res.data.data || []))
      .catch(() => {});
    getBeneficiaries()
      .then(res => {
        const d = res.data.data;
        setBeneficiaries(Array.isArray(d) ? d : (d.content || []));
      })
      .catch(() => {});
  }, [selectedCategory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAssets();
  };

  const openCreateModal = () => {
    setEditingId(null);
    setForm(initialForm);
    setFormFile(null);
    setShowFormModal(true);
  };

  const openEditModal = async (assetId) => {
    setEditingId(assetId);
    setFormFile(null);
    setShowFormModal(true);
    try {
      const res = await getAsset(assetId);
      const a = res.data.data;
      setForm({
        name: a.name || a.assetName || '',
        categoryId: a.categoryId || a.category?.id || '',
        platformName: a.platformName || '',
        assetIdentifier: a.assetIdentifier || '',
        description: a.description || '',
        transferInstructions: a.transferInstructions || '',
        beneficiaryId: a.beneficiaryId || (a.beneficiaries && a.beneficiaries[0]?.id) || '',
        status: a.status || 'ACTIVE'
      });
    } catch {
      toast.error('Failed to load asset details for editing');
    }
  };

  const openDetailModal = async (assetId) => {
    setShowDetailModal(true);
    setDetailLoading(true);
    setShowSecret(false);
    setModalUploadFile(null);
    try {
      const res = await getAsset(assetId);
      setDetailAsset(res.data.data);
    } catch {
      toast.error('Failed to load asset information');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    const trimmedName = form.name.trim();
    const trimmedPlatform = form.platformName.trim();
    const trimmedIdentifier = form.assetIdentifier.trim();
    const catId = Number(form.categoryId);

    if (!trimmedName || trimmedName.length < 2) {
      toast.warning('Asset name must be at least 2 characters long');
      return;
    }
    if (!catId || isNaN(catId) || catId <= 0) {
      toast.warning('Please select an asset category from the dropdown');
      return;
    }
    if (!trimmedPlatform || trimmedPlatform.length < 2) {
      toast.warning('Platform / Service name must be at least 2 characters long');
      return;
    }
    if (!trimmedIdentifier || trimmedIdentifier.length < 2) {
      toast.warning('Asset identifier must be at least 2 characters long');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: trimmedName,
        categoryId: catId,
        platformName: trimmedPlatform,
        assetIdentifier: trimmedIdentifier,
        description: form.description ? form.description.trim() : null,
        transferInstructions: form.transferInstructions ? form.transferInstructions.trim() : null,
        status: form.status || 'ACTIVE'
      };

      if (form.beneficiaryId) {
        const bId = Number(form.beneficiaryId);
        payload.beneficiaryId = bId;
        payload.beneficiaryIds = [bId];
      } else {
        payload.beneficiaryId = null;
        payload.beneficiaryIds = [];
      }

      let assetResult;
      if (editingId) {
        assetResult = await updateAsset(editingId, payload);
        toast.success('Asset updated successfully');
      } else {
        assetResult = await createAssetJson(payload);
        toast.success('New asset created successfully');
      }

      const savedAssetId = editingId || assetResult.data.data.id;

      // If user selected a file to upload alongside asset creation/edit
      if (formFile && savedAssetId) {
        try {
          await uploadAssetFile(savedAssetId, formFile);
          toast.success(`Attached "${formFile.name}" (encrypted with AES-256)`);
        } catch (uploadErr) {
          toast.warn('Asset saved, but file attachment failed: ' + formatApiError(uploadErr, 'File upload failed'));
        }
      }

      setShowFormModal(false);
      setForm(initialForm);
      setFormFile(null);
      fetchAssets();
    } catch (err) {
      toast.error(formatApiError(err, 'Failed to save digital asset'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleModalFileUpload = async (e) => {
    e.preventDefault();
    if (!modalUploadFile || !detailAsset) return;
    setUploadingModalFile(true);
    try {
      await uploadAssetFile(detailAsset.id, modalUploadFile);
      toast.success(`Uploaded "${modalUploadFile.name}" securely`);
      setModalUploadFile(null);
      // Reload asset details to show new file
      const res = await getAsset(detailAsset.id);
      setDetailAsset(res.data.data);
      fetchAssets();
    } catch (err) {
      toast.error(formatApiError(err, 'File upload failed'));
    } finally {
      setUploadingModalFile(false);
    }
  };

  const handleWatchFile = async (assetId, file) => {
    setWatchingFile(file);
    setWatchingAssetId(assetId);
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
    setWatchingAssetId(null);
    setPreviewUrl(null);
    setPreviewTextContent('');
  };

  const handleDeleteFile = async (assetId, fileId, fileName) => {
    if (!window.confirm(`Are you sure you want to remove "${fileName}" from this asset? It will no longer be available to assigned beneficiaries.`)) {
      return;
    }
    try {
      await deleteAssetFile(assetId, fileId);
      toast.success(`Removed "${fileName}" successfully`);
      const res = await getAsset(assetId);
      setDetailAsset(res.data.data);
      fetchAssets();
    } catch {
      toast.error('Failed to remove document');
    }
  };

  const handleDownloadFile = async (fileId, fileName) => {
    setDownloadingFileId(fileId);
    try {
      await downloadAssetFile(detailAsset.id, fileId, fileName);
      toast.info(`Downloaded "${fileName}"`);
    } catch (err) {
      toast.error(formatApiError(err, 'Failed to download file'));
    } finally {
      setDownloadingFileId(null);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete asset "${name}"?`)) return;
    try {
      await deleteAsset(id);
      toast.success('Asset deleted successfully');
      fetchAssets();
      if (detailAsset?.id === id) setShowDetailModal(false);
    } catch {
      toast.error('Failed to delete asset');
    }
  };

  const statusBadge = (s) => {
    const map = {
      ACTIVE: 'success',
      ARCHIVED: 'secondary',
      PENDING_TRANSFER: 'warning',
      TRANSFERRED: 'info'
    };
    return <span className={`badge bg-${map[s] || 'secondary'}`}>{s}</span>;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.info('Copied identifier to clipboard');
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-0 text-dark">Digital Assets</h4>
          <small className="text-muted">Securely manage, protect, and assign your estate assets</small>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <i className="bi bi-plus-lg me-1"></i>Add Digital Asset
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <form onSubmit={handleSearchSubmit} className="row g-2 align-items-center">
            <div className="col-md-5">
              <div className="input-group">
                <span className="input-group-text bg-white"><i className="bi bi-search"></i></span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search assets by name or platform..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-4">
              <select
                className="form-select"
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
              >
                <option value="">All Categories (All 11)</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <button type="submit" className="btn btn-dark w-100">
                <i className="bi bi-filter me-1"></i>Filter
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Assets Table */}
      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>
          ) : assets.length === 0 ? (
            <div className="text-center p-5 text-muted">
              <i className="bi bi-archive fs-1 text-secondary mb-2 d-block"></i>
              No digital assets registered yet.<br />
              Click <strong>"Add Digital Asset"</strong> above to catalog your first estate asset.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Asset Name</th>
                    <th>Category</th>
                    <th>Platform / Provider</th>
                    <th>Status</th>
                    <th>Beneficiaries</th>
                    <th>Files</th>
                    <th className="text-end px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map(a => {
                    const assetId = a.id;
                    const assetName = a.name || a.assetName;
                    const catName = a.categoryName || a.category?.name || 'General';
                    const platform = a.platformName || '-';

                    return (
                      <tr key={assetId}>
                        <td>
                          <button
                            type="button"
                            className="btn btn-link text-decoration-none fw-semibold p-0 text-dark text-start"
                            onClick={() => openDetailModal(assetId)}
                          >
                            {assetName}
                          </button>
                          <div className="text-muted small">
                            {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : ''}
                          </div>
                        </td>
                        <td><span className="badge bg-light text-dark border">{catName}</span></td>
                        <td><i className="bi bi-globe me-1 text-muted"></i>{platform}</td>
                        <td>{statusBadge(a.status)}</td>
                        <td>
                          {a.beneficiaries && a.beneficiaries.length > 0 ? (
                            <span className="badge bg-success bg-opacity-10 text-success">
                              <i className="bi bi-person-check me-1"></i>
                              {a.beneficiaries[0].fullName}
                            </span>
                          ) : (
                            <span className="badge bg-secondary bg-opacity-10 text-secondary">Unassigned</span>
                          )}
                        </td>
                        <td>
                          {a.files && a.files.length > 0 ? (
                            <span className="badge bg-info bg-opacity-10 text-info">
                              <i className="bi bi-file-earmark-lock me-1"></i>
                              {a.files.length} file{a.files.length > 1 ? 's' : ''}
                            </span>
                          ) : (
                            <span className="text-muted small">None</span>
                          )}
                        </td>
                        <td className="text-end px-4">
                          <div className="btn-group btn-group-sm">
                            <button
                              type="button"
                              className="btn btn-outline-info"
                              onClick={() => openDetailModal(assetId)}
                              title="View full asset details, files, and instructions"
                            >
                              <i className="bi bi-eye"></i> Details
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-primary"
                              onClick={() => openEditModal(assetId)}
                              title="Edit asset details"
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-danger"
                              onClick={() => handleDelete(assetId, assetName)}
                              title="Delete asset"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
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

      {/* Detail Modal with Attached Documents */}
      {showDetailModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-primary text-white py-3">
                <h5 className="modal-title d-flex align-items-center">
                  <i className="bi bi-shield-check me-2"></i>
                  Asset Details: {detailAsset?.name || detailAsset?.assetName || 'Asset'}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowDetailModal(false)}></button>
              </div>
              <div className="modal-body p-4">
                {detailLoading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status"></div>
                  </div>
                ) : detailAsset ? (
                  <div>
                    <div className="row g-3 mb-4">
                      <div className="col-md-6">
                        <label className="text-muted small text-uppercase fw-semibold">Platform / Service</label>
                        <div className="fs-6 fw-bold">{detailAsset.platformName || '-'}</div>
                      </div>
                      <div className="col-md-6">
                        <label className="text-muted small text-uppercase fw-semibold">Category</label>
                        <div>
                          <span className="badge bg-light text-dark border">
                            {detailAsset.categoryName || detailAsset.category?.name || '-'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Encrypted Identifier Section */}
                    <div className="p-3 bg-light rounded border mb-4">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <label className="text-muted small text-uppercase fw-semibold mb-0">
                          <i className="bi bi-lock-fill me-1 text-primary"></i>
                          Encrypted Asset Identifier (Reference / Account #)
                        </label>
                        <div>
                          <button
                            type="button"
                            className="btn btn-link btn-sm text-decoration-none p-0 me-3"
                            onClick={() => setShowSecret(!showSecret)}
                          >
                            <i className={`bi ${showSecret ? 'bi-eye-slash' : 'bi-eye'} me-1`}></i>
                            {showSecret ? 'Hide' : 'Reveal'}
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm py-0 px-2"
                            onClick={() => copyToClipboard(detailAsset.assetIdentifier)}
                          >
                            <i className="bi bi-clipboard me-1"></i>Copy
                          </button>
                        </div>
                      </div>
                      <div className="font-monospace fs-6 fw-bold text-dark mt-1">
                        {showSecret ? detailAsset.assetIdentifier : '••••••••••••••••••••••••'}
                      </div>
                      <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                        Protected at rest with AES-256-GCM authenticated encryption.
                      </small>
                    </div>

                    {/* Description */}
                    <div className="mb-3">
                      <label className="text-muted small text-uppercase fw-semibold">Asset Description</label>
                      <div className="p-3 border rounded bg-white">
                        {detailAsset.description || <span className="text-muted fst-italic">No description provided</span>}
                      </div>
                    </div>

                    {/* Transfer Instructions */}
                    <div className="mb-4">
                      <label className="text-muted small text-uppercase fw-semibold">
                        <i className="bi bi-arrow-right-circle me-1 text-success"></i>
                        Transfer & Legacy Instructions
                      </label>
                      <div className="p-3 border rounded bg-white">
                        {detailAsset.transferInstructions || (
                          <span className="text-muted fst-italic">No transfer instructions specified</span>
                        )}
                      </div>
                    </div>

                    {/* Attached Supporting Documents */}
                    <div className="mb-4">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <label className="text-muted small text-uppercase fw-semibold mb-0">
                          <i className="bi bi-file-earmark-lock2-fill me-1 text-success"></i>
                          Attached Documents &amp; Vault Files ({detailAsset.files?.length || 0})
                        </label>
                        <span className="badge bg-success bg-opacity-10 text-success border border-success small">
                          <i className="bi bi-shield-check me-1"></i>SecurityLocker Secure View
                        </span>
                      </div>

                      {detailAsset.files && detailAsset.files.length > 0 ? (
                        <div className="list-group mb-3">
                          {detailAsset.files.map(f => (
                            <div
                              key={f.id}
                              className="list-group-item d-flex justify-content-between align-items-center p-3"
                            >
                              <div className="d-flex align-items-center">
                                <i className="bi bi-file-earmark-check-fill fs-3 text-success me-3"></i>
                                <div>
                                  <div className="fw-semibold text-dark">{f.fileName}</div>
                                  <small className="text-muted">
                                    {formatFileSize(f.fileSize)} • <span className="badge bg-success bg-opacity-10 text-success">AES-256 Encrypted</span> • {f.uploadedAt ? new Date(f.uploadedAt).toLocaleDateString() : ''}
                                  </small>
                                </div>
                              </div>
                              <div className="d-flex align-items-center gap-2">
                                <button
                                  type="button"
                                  className="btn btn-outline-success btn-sm d-inline-flex align-items-center gap-1"
                                  onClick={() => handleWatchFile(detailAsset.id, f)}
                                  title="Watch document in SecurityLocker secure viewer (no download required)"
                                >
                                  <i className="bi bi-eye-fill"></i>
                                  Watch Document
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-outline-danger btn-sm d-inline-flex align-items-center gap-1"
                                  onClick={() => handleDeleteFile(detailAsset.id, f.id, f.fileName)}
                                  title="Remove this document from the asset"
                                >
                                  <i className="bi bi-trash"></i>
                                  Remove
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3 border rounded bg-light text-muted small text-center mb-3">
                          No supporting documents attached to this asset yet.
                        </div>
                      )}

                      {/* Attach Additional File Form */}
                      <form onSubmit={handleModalFileUpload} className="p-3 border rounded bg-light">
                        <label className="form-label small fw-semibold text-dark mb-1">
                          Upload & Encrypt Additional Supporting Document
                        </label>
                        <div className="input-group">
                          <input
                            type="file"
                            className="form-control form-control-sm"
                            onChange={e => setModalUploadFile(e.target.files[0])}
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt,.xlsx"
                          />
                          <button
                            type="submit"
                            className="btn btn-primary btn-sm"
                            disabled={!modalUploadFile || uploadingModalFile}
                          >
                            {uploadingModalFile ? (
                              <><span className="spinner-border spinner-border-sm me-1"></span>Encrypting...</>
                            ) : (
                              <><i className="bi bi-cloud-arrow-up-fill me-1"></i>Upload & Encrypt</>
                            )}
                          </button>
                        </div>
                        <div className="form-text" style={{ fontSize: '0.75rem' }}>
                          Accepts PDF, images, Word docs, Excel sheets (Max 25MB). Stored encrypted with SHA-256 integrity hash.
                        </div>
                      </form>
                    </div>

                    {/* Assigned Beneficiary */}
                    <div>
                      <label className="text-muted small text-uppercase fw-semibold">Designated Beneficiary</label>
                      {detailAsset.beneficiaries && detailAsset.beneficiaries.length > 0 ? (
                        <div className="p-2 border rounded bg-success bg-opacity-10 text-success d-flex align-items-center">
                          <i className="bi bi-person-check-fill fs-5 me-2"></i>
                          <div>
                            <strong>{detailAsset.beneficiaries[0].fullName}</strong> ({detailAsset.beneficiaries[0].email})
                          </div>
                        </div>
                      ) : (
                        <div className="p-2 border rounded bg-light text-muted">
                          No beneficiary assigned yet.
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="modal-footer bg-light py-2">
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={() => {
                    setShowDetailModal(false);
                    openEditModal(detailAsset.id);
                  }}
                >
                  <i className="bi bi-pencil me-1"></i>Edit Asset
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Asset Modal */}
      {showFormModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-dark text-white py-3">
                <h5 className="modal-title">
                  <i className="bi bi-archive me-2 text-primary"></i>
                  {editingId ? 'Edit Digital Asset' : 'Add New Digital Asset'}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowFormModal(false)}></button>
              </div>
              <form onSubmit={handleFormSubmit}>
                <div className="modal-body p-4">
                  <div className="alert alert-warning py-2 small d-flex align-items-center mb-4">
                    <i className="bi bi-shield-exclamation fs-5 me-2 text-danger"></i>
                    <div>
                      <strong>Security Notice:</strong> Never enter actual plaintext passwords, banking PINs, or master recovery seed phrases into asset identifier fields. Store references, account identifiers, or encrypted keys only.
                    </div>
                  </div>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Asset Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        placeholder="e.g. Primary Brokerage Portfolio"
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Asset Category *</label>
                      <select
                        className="form-select"
                        required
                        value={form.categoryId}
                        onChange={e => setForm({ ...form, categoryId: e.target.value })}
                      >
                        <option value="">Select asset category...</option>
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Platform / Service Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        placeholder="e.g. Charles Schwab / Google / AWS"
                        value={form.platformName}
                        onChange={e => setForm({ ...form, platformName: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        Asset Identifier (Encrypted) *
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        placeholder="e.g. Acct #88432-B, Username, Domain"
                        value={form.assetIdentifier}
                        onChange={e => setForm({ ...form, assetIdentifier: e.target.value })}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-semibold">Asset Description</label>
                      <textarea
                        className="form-control"
                        rows="2"
                        placeholder="Brief summary of asset purpose, importance, or holdings..."
                        value={form.description}
                        onChange={e => setForm({ ...form, description: e.target.value })}
                      ></textarea>
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-semibold">Transfer Instructions & Execution Notes</label>
                      <textarea
                        className="form-control"
                        rows="2"
                        placeholder="Detailed instructions for beneficiary upon verified life event..."
                        value={form.transferInstructions}
                        onChange={e => setForm({ ...form, transferInstructions: e.target.value })}
                      ></textarea>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Assign Beneficiary</label>
                      <select
                        className="form-select"
                        value={form.beneficiaryId}
                        onChange={e => setForm({ ...form, beneficiaryId: e.target.value })}
                      >
                        <option value="">None (Unassigned)</option>
                        {beneficiaries.map(b => (
                          <option key={b.id} value={b.id}>
                            {b.fullName} ({b.email})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Asset Status</label>
                      <select
                        className="form-select"
                        value={form.status}
                        onChange={e => setForm({ ...form, status: e.target.value })}
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="ARCHIVED">ARCHIVED</option>
                        <option value="PENDING_TRANSFER">PENDING_TRANSFER</option>
                        <option value="TRANSFERRED">TRANSFERRED</option>
                      </select>
                    </div>

                    {/* File Upload Field */}
                    <div className="col-12">
                      <div className="p-3 bg-light rounded border">
                        <label className="form-label fw-semibold mb-1">
                          <i className="bi bi-paperclip me-1 text-primary"></i>
                          Attach Supporting Document / Evidence (Optional)
                        </label>
                        <input
                          type="file"
                          className="form-control"
                          onChange={e => setFormFile(e.target.files[0])}
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt,.xlsx"
                        />
                        <div className="form-text">
                          Upload legal deeds, trust contracts, statement copies, or recovery guides (Max 25MB, automatically encrypted with AES-256-GCM).
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer bg-light py-2">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowFormModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Saving...' : (editingId ? 'Update Asset' : 'Save Asset')}
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
