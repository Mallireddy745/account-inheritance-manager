import React, { useEffect, useState } from 'react';
import { getNotifications, markAsRead, markAllAsRead, deleteNotification } from '../../api/notificationService';
import { toast } from 'react-toastify';

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = () => {
    setLoading(true);
    getNotifications({ page: 0, size: 50 })
      .then(res => {
        const d = res.data.data;
        setNotifications(d.content || []);
      })
      .catch(() => toast.error('Failed to load administrative notifications'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await markAsRead(id);
      fetchNotifications();
    } catch {
      toast.error('Failed to update notification');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      toast.success('All notifications marked as read');
      fetchNotifications();
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);
      toast.success('Notification deleted');
      fetchNotifications();
    } catch {
      toast.error('Failed to delete notification');
    }
  };

  const typeBadge = (t) => {
    const map = {
      SYSTEM: 'secondary',
      ASSET: 'primary',
      BENEFICIARY: 'success',
      PERMISSION: 'info',
      EMERGENCY_REQUEST: 'danger',
      SECURITY: 'warning'
    };
    return <span className={`badge bg-${map[t] || 'secondary'}`}>{t}</span>;
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-0 text-dark">Administrative Notifications</h4>
          <small className="text-muted">Security alerts, claim activities, and system broadcasts</small>
        </div>
        <button className="btn btn-outline-danger btn-sm" onClick={handleMarkAllRead}>
          <i className="bi bi-check-all me-1"></i>Mark All Read
        </button>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center p-5"><div className="spinner-border text-danger"></div></div>
          ) : notifications.length === 0 ? (
            <div className="text-center p-5 text-muted">No administrative alerts.</div>
          ) : (
            <ul className="list-group list-group-flush">
              {notifications.map(n => (
                <li
                  key={n.id}
                  className={`list-group-item d-flex justify-content-between align-items-start p-3 ${
                    !n.isRead ? 'bg-danger bg-opacity-10' : ''
                  }`}
                >
                  <div className="ms-2 me-auto">
                    <div className="fw-bold d-flex align-items-center gap-2 mb-1">
                      {n.title} {typeBadge(n.type)}
                      {!n.isRead && <span className="badge bg-danger">New</span>}
                    </div>
                    <div className="text-dark small mb-1">{n.message}</div>
                    <small className="text-muted">
                      {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
                    </small>
                  </div>
                  <div className="d-flex gap-2">
                    {!n.isRead && (
                      <button className="btn btn-outline-secondary btn-sm" onClick={() => handleMarkRead(n.id)}>
                        <i className="bi bi-check"></i>
                      </button>
                    )}
                    <button className="btn btn-outline-danger btn-sm" onClick={() => handleDelete(n.id)}>
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
