import React, { useEffect, useState } from 'react';
import { getPermissions, grantPermission, revokePermission, deletePermission } from '../../api/permissionService';
import { getAssets } from '../../api/assetService';
import { getBeneficiaries } from '../../api/beneficiaryService';
import { toast } from 'react-toastify';
import { formatApiError } from '../../utils/errorHandler';

export default function Permissions() {
  const [perms, setPerms] = useState([]);
  const [assets, setAssets] = useState([]);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    assetId: '',
    beneficiaryId: '',
    permissionType: 'VIEW',
    accessCondition: ''
  });

  const fetchPerms = () => {
    setLoading(true);
    getPermissions()
      .then(res => {
        const d = res.data.data;
        setPerms(Array.isArray(d) ? d : (d.content || []));
      })
      .catch(() => toast.error('Failed to load asset permissions'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPerms();
    getAssets().then(res => {
      const d = res.data.data;
      setAssets(Array.isArray(d) ? d : (d.content || []));
    }).catch(() => {});
    getBeneficiaries().then(res => {
      const d = res.data.data;
      setBeneficiaries(Array.isArray(d) ? d : (d.content || []));
    }).catch(() => {});
  }, []);

  const handleGrant = async (e) => {
    e.preventDefault();

    if (!form.assetId) {
      toast.warning('Please select an estate asset');
      return;
    }
    if (!form.beneficiaryId) {
      toast.warning('Please select a beneficiary');
      return;
    }

    setSubmitting(true);
    try {
      await grantPermission({
        assetId: Number(form.assetId),
        beneficiaryId: Number(form.beneficiaryId),
        permissionType: form.permissionType,
        accessCondition: form.accessCondition ? form.accessCondition.trim() : null
      });
      toast.success('Permission granted successfully');
      setShowModal(false);
      setForm({ assetId: '', beneficiaryId: '', permissionType: 'VIEW', accessCondition: '' });
      fetchPerms();
    } catch (err) {
      toast.error(formatApiError(err, 'Failed to grant permission'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (id) => {
    if (!window.confirm('Are you sure you want to revoke this beneficiary permission?')) return;
    try {
      await revokePermission(id);
      toast.success('Permission revoked');
      fetchPerms();
    } catch {
      toast.error('Failed to revoke permission');
    }
  };

  const handleDeletePerm = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this permission record?')) return;
    try {
      await deletePermission(id);
      toast.success('Permission record deleted');
      fetchPerms();
    } catch {
      toast.error('Failed to delete permission');
    }
  };

  const permTypes = [
    { type: 'VIEW', label: 'View Asset Metadata' },
    { type: 'DOWNLOAD', label: 'Download Files & Attachments' },
    { type: 'TRANSFER', label: 'Full Asset Ownership Transfer' },
    { type: 'LIMITED_ACCESS', label: 'Limited Access' },
    { type: 'EMERGENCY_ACCESS', label: 'Emergency Access (Incapacity / Death)' },
  ];

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-0 text-dark">Asset Access Permissions</h4>
          <small className="text-muted">Define conditional access rights, view permissions, and transfer mandates</small>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <i className="bi bi-shield-plus me-1"></i>Grant Permission
        </button>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>
          ) : perms.length === 0 ? (
            <div className="text-center p-5 text-muted">
              <i className="bi bi-shield-check fs-1 text-secondary mb-2 d-block"></i>
              No asset permissions granted yet.<br />
              Click <strong>"Grant Permission"</strong> to delegate access to your beneficiaries.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Asset</th>
                    <th>Beneficiary</th>
                    <th>Permission Type</th>
                    <th>Access Condition</th>
                    <th>Status</th>
                    <th className="text-end px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {perms.map(p => (
                    <tr key={p.id}>
                      <td className="fw-semibold text-dark">{p.assetName || '-'}</td>
                      <td>{p.beneficiaryName || '-'}</td>
                      <td>
                        <span className="badge bg-primary bg-opacity-10 text-primary">
                          {p.permissionType}
                        </span>
                      </td>
                      <td>
                        <small className="text-muted">
                          {p.accessCondition || 'Immediate unconditional access'}
                        </small>
                      </td>
                      <td>
                        {p.revoked ? (
                          <span className="badge bg-danger">Revoked</span>
                        ) : (
                          <span className="badge bg-success">Active</span>
                        )}
                      </td>
                      <td className="text-end px-4">
                        <div className="btn-group btn-group-sm">
                          {!p.revoked && (
                            <button
                              type="button"
                              className="btn btn-outline-warning"
                              onClick={() => handleRevoke(p.id)}
                              title="Revoke access"
                            >
                              Revoke
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            onClick={() => handleDeletePerm(p.id)}
                            title="Delete record"
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

      {/* Grant Permission Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-dark text-white py-3">
                <h5 className="modal-title">
                  <i className="bi bi-shield-lock-fill me-2 text-primary"></i>
                  Grant Asset Permission
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleGrant}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Target Estate Asset *</label>
                    <select
                      className="form-select"
                      required
                      value={form.assetId}
                      onChange={e => setForm({ ...form, assetId: e.target.value })}
                    >
                      <option value="">Select digital asset...</option>
                      {assets.map(a => (
                        <option key={a.id} value={a.id}>{a.name || a.assetName}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Designated Beneficiary *</label>
                    <select
                      className="form-select"
                      required
                      value={form.beneficiaryId}
                      onChange={e => setForm({ ...form, beneficiaryId: e.target.value })}
                    >
                      <option value="">Select beneficiary...</option>
                      {beneficiaries.map(b => (
                        <option key={b.id} value={b.id}>{b.fullName} ({b.email})</option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Permission Level *</label>
                    <select
                      className="form-select"
                      value={form.permissionType}
                      onChange={e => setForm({ ...form, permissionType: e.target.value })}
                    >
                      {permTypes.map(pt => (
                        <option key={pt.type} value={pt.type}>
                          {pt.type} - {pt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Access Condition & Stipulations</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      placeholder="e.g. Requires certified death certificate or proof of medical incapacitation"
                      value={form.accessCondition}
                      onChange={e => setForm({ ...form, accessCondition: e.target.value })}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer bg-light py-2">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Granting...' : 'Grant Permission'}
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
