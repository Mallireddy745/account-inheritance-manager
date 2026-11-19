import React, { useEffect, useState } from 'react';
import { getAdminAssets, getAdminAssetDetails, downloadAdminAssetFile } from '../../api/adminService';
import { toast } from 'react-toastify';

export default function AdminAssets() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Inspection Modal State
  const [showModal, setShowModal] = useState(false);
  const [inspectLoading, setInspectLoading] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showIdentifier, setShowIdentifier] = useState(false);
  const [downloadingFileId, setDownloadingFileId] = useState(null);

  const fetchAssets = () => {
    setLoading(true);
    const params = { page, size: 10 };
    if (search) params.search = search;
    if (category) params.category = category;

    getAdminAssets(params)
      .then(res => {
        const d = res.data.data;
        setAssets(d.content || []);
        setTotalPages(d.totalPages || 0);
      })
      .catch(() => toast.error('Failed to load platform assets'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAssets();
  }, [page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    fetchAssets();
  };

  const openInspectModal = async (asset) => {
    setSelectedAsset(asset);
    setShowModal(true);
    setInspectLoading(true);
    setShowIdentifier(false);
    try {
      const res = await getAdminAssetDetails(asset.id);
      setSelectedAsset({ ...asset, ...res.data.data });
    } catch {
      toast.error('Failed to fetch detailed asset information and attached documents');
    } finally {
      setInspectLoading(false);
    }
  };

  const handleDownloadFile = async (fileId, fileName) => {
    if (!selectedAsset) return;
    setDownloadingFileId(fileId);
    try {
      await downloadAdminAssetFile(selectedAsset.id, fileId, fileName);
      toast.success(`Decrypted and downloaded "${fileName}"`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to download file');
    } finally {
      setDownloadingFileId(null);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.info('Copied to clipboard');
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
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

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-0 text-dark">Global Digital Assets</h4>
          <small className="text-muted">
            Oversee registered estate assets across all users, inspect encrypted vaults, and review attached documents
          </small>
        </div>
      </div>

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <form onSubmit={handleSearch} className="row g-2 align-items-center">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text bg-white"><i className="bi bi-search"></i></span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search asset name or platform..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-4">
              <input
                type="text"
                className="form-control"
                placeholder="Filter by category name..."
                value={category}
                onChange={e => setCategory(e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <button type="submit" className="btn btn-dark w-100">
                <i className="bi bi-filter me-1"></i>Filter
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center p-5"><div className="spinner-border text-danger"></div></div>
          ) : assets.length === 0 ? (
            <div className="text-center p-5 text-muted">No assets found matching current criteria.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Asset Name</th>
                    <th>Category</th>
                    <th>Platform</th>
                    <th>Owner</th>
                    <th>Status</th>
                    <th>Beneficiaries</th>
                    <th>Registered</th>
                    <th className="text-end px-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map(a => (
                    <tr key={a.id}>
                      <td className="fw-semibold">
                        <div className="d-flex align-items-center">
                          <i className="bi bi-shield-lock-fill text-danger me-2"></i>
                          <span>{a.assetName}</span>
                        </div>
                      </td>
                      <td><span className="badge bg-light text-dark border">{a.categoryName}</span></td>
                      <td>{a.platformName}</td>
                      <td>
                        <div className="fw-semibold small">{a.ownerName}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>{a.ownerEmail}</div>
                      </td>
                      <td>{statusBadge(a.status)}</td>
                      <td>
                        <span className="badge bg-primary bg-opacity-10 text-primary">
                          {a.beneficiaryCount || 0} assigned
                        </span>
                      </td>
                      <td className="text-muted small">
                        {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="text-end px-3">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger d-inline-flex align-items-center"
                          onClick={() => openInspectModal(a)}
                          title="Inspect asset details and attached files"
                        >
                          <i className="bi bi-eye-fill me-1"></i>
                          Inspect & Files
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

      {/* Asset Inspection & Files Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.65)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-dark text-white py-3">
                <div className="d-flex align-items-center">
                  <span className="badge bg-danger me-2">ADMIN REVIEW</span>
                  <h5 className="modal-title mb-0">
                    Asset Details: {selectedAsset?.name || selectedAsset?.assetName || 'Asset'}
                  </h5>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>

              <div className="modal-body p-4">
                {inspectLoading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-danger" role="status"></div>
                    <div className="text-muted small mt-2">Decrypting & loading asset metadata...</div>
                  </div>
                ) : selectedAsset ? (
                  <div>
                    {/* Top Overview Cards */}
                    <div className="row g-3 mb-4">
                      <div className="col-md-4">
                        <div className="p-3 bg-light rounded border">
                          <label className="text-muted small text-uppercase fw-semibold mb-1">Platform / Service</label>
                          <div className="fw-bold fs-6 text-dark">{selectedAsset.platformName || '-'}</div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="p-3 bg-light rounded border">
                          <label className="text-muted small text-uppercase fw-semibold mb-1">Asset Category</label>
                          <div>
                            <span className="badge bg-secondary">
                              {selectedAsset.categoryName || selectedAsset.category?.name || '-'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="p-3 bg-light rounded border">
                          <label className="text-muted small text-uppercase fw-semibold mb-1">Asset Status</label>
                          <div>{statusBadge(selectedAsset.status)}</div>
                        </div>
                      </div>
                    </div>

                    {/* Owner Info Banner */}
                    <div className="p-3 rounded mb-4" style={{ backgroundColor: '#f8f9fa', borderLeft: '4px solid #dc3545' }}>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <div className="small text-uppercase text-muted fw-semibold">Asset Registered Owner</div>
                          <div className="fw-bold text-dark fs-6">
                            {selectedAsset.ownerName || 'User Account'}
                          </div>
                          <div className="small text-muted">{selectedAsset.ownerEmail}</div>
                        </div>
                        <div className="text-end">
                          <span className="badge bg-light text-dark border">
                            Created: {selectedAsset.createdAt ? new Date(selectedAsset.createdAt).toLocaleDateString() : '-'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Encrypted Identifier Section */}
                    <div className="p-3 bg-light rounded border mb-4">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <label className="text-muted small text-uppercase fw-semibold mb-0">
                          <i className="bi bi-shield-lock-fill me-1 text-danger"></i>
                          Encrypted Identifier / Account Reference
                        </label>
                        <div>
                          <button
                            type="button"
                            className="btn btn-link btn-sm text-decoration-none p-0 me-3"
                            onClick={() => setShowIdentifier(!showIdentifier)}
                          >
                            <i className={`bi ${showIdentifier ? 'bi-eye-slash' : 'bi-eye'} me-1`}></i>
                            {showIdentifier ? 'Hide' : 'Reveal'}
                          </button>
                          {selectedAsset.assetIdentifier && (
                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm py-0 px-2"
                              onClick={() => copyToClipboard(selectedAsset.assetIdentifier)}
                            >
                              <i className="bi bi-clipboard me-1"></i>Copy
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="font-monospace fs-6 fw-bold text-dark mt-1">
                        {showIdentifier ? (selectedAsset.assetIdentifier || '(Empty)') : '••••••••••••••••••••••••'}
                      </div>
                      <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                        Stored encrypted in MySQL with AES-256-GCM. Decrypted on-the-fly for administrative review.
                      </small>
                    </div>

                    {/* Description */}
                    <div className="mb-3">
                      <label className="text-muted small text-uppercase fw-semibold mb-1">Description</label>
                      <div className="p-3 border rounded bg-white">
                        {selectedAsset.description || <span className="text-muted fst-italic">No description provided</span>}
                      </div>
                    </div>

                    {/* Transfer & Execution Instructions */}
                    <div className="mb-4">
                      <label className="text-muted small text-uppercase fw-semibold mb-1">
                        <i className="bi bi-arrow-right-circle me-1 text-success"></i>
                        Transfer & Legacy Execution Instructions
                      </label>
                      <div className="p-3 border rounded bg-white">
                        {selectedAsset.transferInstructions || (
                          <span className="text-muted fst-italic">No transfer instructions provided</span>
                        )}
                      </div>
                    </div>

                    {/* Assigned Beneficiaries */}
                    <div className="mb-4">
                      <label className="text-muted small text-uppercase fw-semibold mb-2">
                        <i className="bi bi-people-fill me-1 text-primary"></i>
                        Designated Beneficiaries ({selectedAsset.beneficiaries?.length || 0})
                      </label>
                      {selectedAsset.beneficiaries && selectedAsset.beneficiaries.length > 0 ? (
                        <div className="list-group">
                          {selectedAsset.beneficiaries.map(b => (
                            <div key={b.id} className="list-group-item d-flex justify-content-between align-items-center py-2 px-3">
                              <div>
                                <span className="fw-semibold text-dark">{b.fullName}</span>
                                <span className="text-muted small ms-2">({b.relationship || 'Designated Beneficiary'})</span>
                                {b.email && <div className="text-muted small">{b.email}</div>}
                              </div>
                              <span className="badge bg-primary bg-opacity-10 text-primary">
                                {b.allocationPercentage ? `${b.allocationPercentage}% Share` : 'Designated'}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-2 border rounded bg-light text-muted small">
                          No beneficiaries assigned to this asset.
                        </div>
                      )}
                    </div>

                    {/* Attached Supporting Documents & Vault Files */}
                    <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <label className="text-muted small text-uppercase fw-semibold mb-0">
                          <i className="bi bi-paperclip me-1 text-danger"></i>
                          Attached Supporting Documents & Encrypted Vault Files ({selectedAsset.files?.length || 0})
                        </label>
                      </div>

                      {selectedAsset.files && selectedAsset.files.length > 0 ? (
                        <div className="list-group">
                          {selectedAsset.files.map(f => (
                            <div
                              key={f.id}
                              className="list-group-item d-flex justify-content-between align-items-center p-3 border rounded mb-2 shadow-sm"
                            >
                              <div className="d-flex align-items-center">
                                <i className="bi bi-file-earmark-lock2-fill fs-2 text-danger me-3"></i>
                                <div>
                                  <div className="fw-bold text-dark">{f.fileName}</div>
                                  <div className="text-muted small">
                                    <span>{formatFileSize(f.fileSize)}</span>
                                    <span className="mx-2">•</span>
                                    <span className="badge bg-success bg-opacity-10 text-success border border-success">
                                      <i className="bi bi-shield-check me-1"></i>AES-256 Encrypted
                                    </span>
                                    {f.uploadedAt && (
                                      <>
                                        <span className="mx-2">•</span>
                                        <span>Uploaded: {new Date(f.uploadedAt).toLocaleString()}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div>
                                <button
                                  type="button"
                                  className="btn btn-outline-danger btn-sm px-3"
                                  disabled={downloadingFileId === f.id}
                                  onClick={() => handleDownloadFile(f.id, f.fileName)}
                                  title="Decrypt and download file"
                                >
                                  {downloadingFileId === f.id ? (
                                    <>
                                      <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                                      Decrypting...
                                    </>
                                  ) : (
                                    <>
                                      <i className="bi bi-download me-1"></i>
                                      Download & Decrypt
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3 border rounded bg-light text-muted small text-center">
                          <i className="bi bi-file-earmark-x fs-4 d-block mb-1 text-secondary"></i>
                          No supporting documents or vault files attached to this digital asset.
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="modal-footer bg-light py-2">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
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
