import React, { useEffect, useState } from 'react';
import { getAdminUsers, changeUserStatus, getAdminUserDetail, createVerifier } from '../../api/adminService';
import { toast } from 'react-toastify';
import { formatApiError } from '../../utils/errorHandler';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Manage User Modal State
  const [modalUser, setModalUser] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Create Verifier Modal State
  const [showVerifierModal, setShowVerifierModal] = useState(false);
  const [verifierForm, setVerifierForm] = useState({
    fullName: '',
    emailPrefix: '',
    password: '',
    phoneNumber: '',
    notes: ''
  });
  const [creatingVerifier, setCreatingVerifier] = useState(false);

  const fetchUsers = () => {
    setLoading(true);
    const params = { page, size: 10 };
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;

    getAdminUsers(params)
      .then(res => {
        const d = res.data.data;
        setUsers(d.content || []);
        setTotalPages(d.totalPages || 0);
      })
      .catch(() => toast.error('Failed to load registered users'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, [page, statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    fetchUsers();
  };

  const handleOpenManageModal = async (u) => {
    setModalUser(u);
    setModalLoading(true);
    try {
      const res = await getAdminUserDetail(u.id);
      setModalUser(res.data.data);
    } catch {
      // Keep current user data from row
    } finally {
      setModalLoading(false);
    }
  };

  const handleCloseModal = () => {
    setModalUser(null);
  };

  const handleStatusChange = async (userId, newStatus) => {
    if (!window.confirm(`Are you sure you want to change user status to ${newStatus}?`)) return;
    setActionLoading(true);
    try {
      const res = await changeUserStatus(userId, newStatus);
      toast.success(`User status changed to ${newStatus}`);
      fetchUsers();
      if (modalUser?.id === userId) {
        setModalUser(res.data.data || { ...modalUser, status: newStatus });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateVerifierSubmit = async (e) => {
    e.preventDefault();
    const prefix = verifierForm.emailPrefix.trim().toLowerCase().replace(/@.*$/, '');
    if (!prefix) {
      toast.warning('Please enter an email username for the verifier');
      return;
    }
    const fullEmail = `${prefix}@digitallegacy.com`;

    if (!verifierForm.fullName || verifierForm.fullName.trim().length < 2) {
      toast.warning('Full name must be at least 2 characters');
      return;
    }
    if (!verifierForm.password || verifierForm.password.length < 8) {
      toast.warning('Password must be at least 8 characters');
      return;
    }

    setCreatingVerifier(true);
    try {
      await createVerifier({
        fullName: verifierForm.fullName.trim(),
        email: fullEmail,
        password: verifierForm.password,
        phoneNumber: verifierForm.phoneNumber ? verifierForm.phoneNumber.trim() : null,
        notes: verifierForm.notes
      });
      toast.success(`Verifier account (${fullEmail}) created and approved!`);
      setShowVerifierModal(false);
      setVerifierForm({ fullName: '', emailPrefix: '', password: '', phoneNumber: '', notes: '' });
      fetchUsers();
    } catch (err) {
      toast.error(formatApiError(err, 'Failed to create verifier account'));
    } finally {
      setCreatingVerifier(false);
    }
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case 'ACTIVE': return <span className="badge bg-success">Active</span>;
      case 'INACTIVE': return <span className="badge bg-secondary">Inactive</span>;
      case 'SUSPENDED': return <span className="badge bg-danger">Suspended</span>;
      default: return <span className="badge bg-dark">{st}</span>;
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'VERIFIER':
        return (
          <span className="badge bg-warning text-dark border border-warning">
            <i className="bi bi-patch-check-fill me-1"></i>VERIFIER
          </span>
        );
      case 'BENEFICIARY':
        return (
          <span className="badge bg-info bg-opacity-10 text-dark border border-info">
            <i className="bi bi-gift me-1"></i>BENEFICIARY
          </span>
        );
      case 'OWNER':
      default:
        return (
          <span className="badge bg-primary bg-opacity-10 text-primary border border-primary">
            <i className="bi bi-person me-1"></i>ESTATE OWNER
          </span>
        );
    }
  };

  const filteredUsers = users.filter(u => {
    if (!roleFilter) return true;
    return u.role === roleFilter;
  });

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h4 className="fw-bold mb-0 text-dark">User &amp; Verifier Management</h4>
          <small className="text-muted">Monitor users, assign licensed verifiers with official @digitallegacy.com credentials, and manage statuses</small>
        </div>
        <button
          className="btn btn-warning text-dark fw-semibold shadow-sm"
          onClick={() => setShowVerifierModal(true)}
        >
          <i className="bi bi-patch-check-fill me-1"></i>
          Provision / Create Verifier
        </button>
      </div>

      {/* Filter and Search */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <form onSubmit={handleSearch} className="row g-2 align-items-center">
            <div className="col-md-5">
              <div className="input-group">
                <span className="input-group-text bg-white"><i className="bi bi-search"></i></span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by email or name..."
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
                <option value="">All Account Statuses</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>
            </div>
            <div className="col-md-2">
              <select
                className="form-select"
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
              >
                <option value="">All Roles</option>
                <option value="VERIFIER">VERIFIERS ONLY</option>
                <option value="OWNER">ESTATE OWNERS</option>
                <option value="BENEFICIARY">BENEFICIARIES</option>
              </select>
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
          ) : filteredUsers.length === 0 ? (
            <div className="text-center p-5 text-muted">No users found matching current filters.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Assets</th>
                    <th>Beneficiaries</th>
                    <th>Joined</th>
                    <th className="text-end px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div className="fw-semibold text-dark">{u.fullName || 'No name'}</div>
                        <div className="text-muted small">{u.email}</div>
                      </td>
                      <td>{getRoleBadge(u.role)}</td>
                      <td>{getStatusBadge(u.status)}</td>
                      <td><span className="badge bg-primary bg-opacity-10 text-primary">{u.assetCount || 0}</span></td>
                      <td><span className="badge bg-success bg-opacity-10 text-success">{u.beneficiaryCount || 0}</span></td>
                      <td className="text-muted small">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="text-end px-4">
                        <div className="btn-group btn-group-sm">
                          <button
                            type="button"
                            className="btn btn-outline-primary"
                            onClick={() => handleOpenManageModal(u)}
                            title="Manage user details and permissions"
                          >
                            <i className="bi bi-gear-fill me-1"></i>Manage
                          </button>
                          {u.status !== 'ACTIVE' && (
                            <button
                              type="button"
                              className="btn btn-outline-success"
                              onClick={() => handleStatusChange(u.id, 'ACTIVE')}
                              title="Activate / Approve account"
                            >
                              <i className="bi bi-check-circle"></i>
                            </button>
                          )}
                          {u.status !== 'SUSPENDED' && (
                            <button
                              type="button"
                              className="btn btn-outline-danger"
                              onClick={() => handleStatusChange(u.id, 'SUSPENDED')}
                              title="Suspend account"
                            >
                              <i className="bi bi-slash-circle"></i>
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

      {/* Provision Verifier Modal */}
      {showVerifierModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-dark text-white py-3">
                <h5 className="modal-title d-flex align-items-center">
                  <i className="bi bi-patch-check-fill text-warning me-2"></i>
                  Provision &amp; Approve Licensed Verifier
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowVerifierModal(false)}></button>
              </div>
              <form onSubmit={handleCreateVerifierSubmit}>
                <div className="modal-body p-4">
                  <div className="alert alert-warning py-2 px-3 small border-0 mb-3 bg-warning bg-opacity-10 text-dark">
                    <i className="bi bi-shield-check text-warning me-2 fw-bold"></i>
                    <strong>Admin Verifier Provisioning:</strong> Verifier accounts cannot self-register. Only administrators can assign and approve verifiers, and their email address must strictly use the official <code>@digitallegacy.com</code> domain.
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Verifier Full Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. Officer Sarah Jenkins"
                      value={verifierForm.fullName}
                      onChange={e => setVerifierForm({ ...verifierForm, fullName: e.target.value })}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Official Email Address *</label>
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control"
                        required
                        placeholder="e.g. sjenkins"
                        value={verifierForm.emailPrefix}
                        onChange={e => setVerifierForm({ ...verifierForm, emailPrefix: e.target.value })}
                      />
                      <span className="input-group-text bg-light fw-bold text-dark">@digitallegacy.com</span>
                    </div>
                    <small className="text-muted">Resulting email: {verifierForm.emailPrefix ? `${verifierForm.emailPrefix.trim()}@digitallegacy.com` : 'username@digitallegacy.com'}</small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Initial Password *</label>
                    <input
                      type="password"
                      className="form-control"
                      required
                      placeholder="Min 8 characters (e.g. Verifier@12345)"
                      value={verifierForm.password}
                      onChange={e => setVerifierForm({ ...verifierForm, password: e.target.value })}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Phone Number (Optional)</label>
                    <input
                      type="tel"
                      className="form-control"
                      placeholder="+1-555-0199"
                      value={verifierForm.phoneNumber}
                      onChange={e => setVerifierForm({ ...verifierForm, phoneNumber: e.target.value })}
                    />
                  </div>
                </div>
                <div className="modal-footer bg-light py-2">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowVerifierModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-warning text-dark fw-bold" disabled={creatingVerifier}>
                    {creatingVerifier ? (
                      <><span className="spinner-border spinner-border-sm me-2"></span>Creating Verifier...</>
                    ) : (
                      <><i className="bi bi-check2-circle me-1"></i>Approve &amp; Create Verifier</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Full Manage User Modal */}
      {modalUser && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-dark text-white py-3">
                <h5 className="modal-title d-flex align-items-center">
                  <i className="bi bi-person-gear me-2 text-danger"></i>
                  Manage User: {modalUser.fullName || modalUser.email}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={handleCloseModal}></button>
              </div>
              <div className="modal-body p-4">
                {modalLoading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-danger" role="status"></div>
                    <div className="text-muted mt-2">Loading user details...</div>
                  </div>
                ) : (
                  <div>
                    {/* User Profile Card */}
                    <div className="row g-3 mb-4">
                      <div className="col-md-6">
                        <div className="p-3 bg-light rounded border">
                          <small className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.75rem' }}>Identity Details</small>
                          <div className="mt-2">
                            <div className="fw-bold fs-5 text-dark">{modalUser.fullName || 'No Name Provided'}</div>
                            <div className="text-muted"><i className="bi bi-envelope me-1"></i>{modalUser.email}</div>
                            <div className="text-muted"><i className="bi bi-telephone me-1"></i>{modalUser.phoneNumber || 'No phone number'}</div>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="p-3 bg-light rounded border">
                          <small className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.75rem' }}>Account Status &amp; Role</small>
                          <div className="mt-2">
                            <div className="mb-2">
                              <strong>Role:</strong> <span className="ms-1">{getRoleBadge(modalUser.role)}</span>
                            </div>
                            <div className="mb-2">
                              <strong>Status:</strong> <span className="ms-1">{getStatusBadge(modalUser.status)}</span>
                            </div>
                            <div className="small text-muted">
                              <strong>Member Since:</strong> {modalUser.createdAt ? new Date(modalUser.createdAt).toLocaleDateString() : '-'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Estate Statistics */}
                    <h6 className="fw-bold text-uppercase text-muted small mb-3">Estate Overview</h6>
                    <div className="row g-3 mb-4 text-center">
                      <div className="col-4">
                        <div className="p-3 border rounded bg-white shadow-sm">
                          <div className="fs-3 fw-bold text-primary">{modalUser.assetCount || 0}</div>
                          <small className="text-muted">Digital Assets</small>
                        </div>
                      </div>
                      <div className="col-4">
                        <div className="p-3 border rounded bg-white shadow-sm">
                          <div className="fs-3 fw-bold text-success">{modalUser.beneficiaryCount || 0}</div>
                          <small className="text-muted">Beneficiaries</small>
                        </div>
                      </div>
                      <div className="col-4">
                        <div className="p-3 border rounded bg-white shadow-sm">
                          <div className="fs-3 fw-bold text-warning">{modalUser.pendingRequestCount || 0}</div>
                          <small className="text-muted">Pending Claims</small>
                        </div>
                      </div>
                    </div>

                    {/* Account Status Control Center */}
                    <div className="p-3 border rounded bg-white shadow-sm">
                      <h6 className="fw-bold mb-2">Change Account Status</h6>
                      <p className="text-muted small mb-3">
                        Updating user status immediately enforces access restrictions across all web sessions and API tokens.
                      </p>
                      <div className="d-flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="btn btn-success"
                          disabled={modalUser.status === 'ACTIVE' || actionLoading}
                          onClick={() => handleStatusChange(modalUser.id, 'ACTIVE')}
                        >
                          <i className="bi bi-check-circle me-1"></i>
                          {modalUser.status === 'ACTIVE' ? 'Currently Active' : 'Set to ACTIVE (Approved)'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          disabled={modalUser.status === 'INACTIVE' || actionLoading}
                          onClick={() => handleStatusChange(modalUser.id, 'INACTIVE')}
                        >
                          <i className="bi bi-pause-circle me-1"></i>
                          {modalUser.status === 'INACTIVE' ? 'Currently Inactive' : 'Set to INACTIVE'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger"
                          disabled={modalUser.status === 'SUSPENDED' || actionLoading}
                          onClick={() => handleStatusChange(modalUser.id, 'SUSPENDED')}
                        >
                          <i className="bi bi-slash-circle me-1"></i>
                          {modalUser.status === 'SUSPENDED' ? 'Currently Suspended' : 'Suspend Account'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer bg-light py-2">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
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
