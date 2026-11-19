import React, { useEffect, useState } from 'react';
import { getAllSettings, updateSetting } from '../../api/adminService';
import { toast } from 'react-toastify';

export default function AdminSettings() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSetting, setSelectedSetting] = useState(null);
  const [newValue, setNewValue] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchSettings = () => {
    setLoading(true);
    getAllSettings()
      .then(res => setSettings(res.data.data || []))
      .catch(() => toast.error('Failed to load system settings'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const openEdit = (s) => {
    setSelectedSetting(s);
    setNewValue(s.settingValue || '');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedSetting) return;
    setSaving(true);
    try {
      await updateSetting(selectedSetting.settingKey, newValue);
      toast.success(`Setting '${selectedSetting.settingKey}' updated`);
      setSelectedSetting(null);
      fetchSettings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update setting');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-0 text-dark">Platform Settings</h4>
          <small className="text-muted">Manage system configuration, security thresholds, and storage limits</small>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center p-5"><div className="spinner-border text-danger"></div></div>
          ) : settings.length === 0 ? (
            <div className="text-center p-5 text-muted">No system settings found.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Setting Key</th>
                    <th>Current Value</th>
                    <th>Description</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {settings.map(s => (
                    <tr key={s.id}>
                      <td className="fw-bold text-dark">{s.settingKey}</td>
                      <td>
                        <code className="bg-light p-1 rounded text-danger">{s.settingValue}</code>
                      </td>
                      <td className="text-muted small">{s.description || '-'}</td>
                      <td>
                        <button className="btn btn-outline-dark btn-sm" onClick={() => openEdit(s)}>
                          <i className="bi bi-pencil me-1"></i>Edit
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

      {/* Edit Setting Modal */}
      {selectedSetting && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title">Edit Configuration</h5>
                <button className="btn-close btn-close-white" onClick={() => setSelectedSetting(null)}></button>
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Setting Key</label>
                    <input className="form-control" value={selectedSetting.settingKey} disabled />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Description</label>
                    <div className="form-text mt-0 mb-2">{selectedSetting.description}</div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Setting Value</label>
                    <textarea
                      className="form-control font-monospace"
                      rows="3"
                      required
                      value={newValue}
                      onChange={e => setNewValue(e.target.value)}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setSelectedSetting(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-danger" disabled={saving}>
                    {saving ? 'Updating...' : 'Save Configuration'}
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
