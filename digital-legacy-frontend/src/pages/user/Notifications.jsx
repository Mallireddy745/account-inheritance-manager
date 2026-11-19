import React, { useEffect, useState } from 'react';
import { getNotifications, markAsRead, markAllAsRead, deleteNotification } from '../../api/notificationService';
import { toast } from 'react-toastify';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [onlyUnread, setOnlyUnread] = useState(false);

  const fetchData = () => {
    setLoading(true);
    getNotifications({ page: 0, size: 50 })
      .then(res => {
        const d = res.data.data;
        setNotifications(d.content || []);
      })
      .catch(() => toast.error('Failed to load notifications'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await markAsRead(id);
      fetchData();
    } catch {
      toast.error('Failed to mark notification');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      toast.success('All notifications marked as read');
      fetchData();
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);
      toast.success('Notification removed');
      fetchData();
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

  const displayedList = onlyUnread ? notifications.filter(n => !n.isRead) : notifications;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-0 text-dark">Notifications & Security Alerts</h4>
          <small className="text-muted">Lifecycle events, claim notifications, and account alerts</small>
        </div>
        <div className="d-flex gap-2">
          <button
            className={`btn btn-sm ${onlyUnread ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setOnlyUnread(!onlyUnread)}
          >
            <i className={`bi ${onlyUnread ? 'bi-funnel-fill' : 'bi-funnel'} me-1`}></i>
            {onlyUnread ? 'Showing Unread' : 'Filter Unread'}
          </button>
          <button className="btn btn-outline-primary btn-sm" onClick={handleMarkAllRead}>
            <i className="bi bi-check-all me-1"></i>Mark All as Read
          </button>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>
          ) : displayedList.length === 0 ? (
            <div className="text-center p-5 text-muted">
              <i className="bi bi-bell-slash fs-1 text-secondary mb-2 d-block"></i>
              {onlyUnread ? 'No unread notifications.' : 'No notifications currently recorded.'}
            </div>
          ) : (
            <ul className="list-group list-group-flush">
              {displayedList.map(n => (
                <li
                  key={n.id}
                  className={`list-group-item d-flex justify-content-between align-items-start p-3 ${
                    !n.isRead ? 'bg-primary bg-opacity-10' : ''
                  }`}
                >
                  <div className="ms-2 me-auto">
                    <div className="fw-bold text-dark d-flex align-items-center gap-2 mb-1">
                      {n.title} {typeBadge(n.type)}
                      {!n.isRead && <span className="badge bg-primary" style={{ fontSize: '0.65rem' }}>New</span>}
                    </div>
                    <div className="text-muted small mb-1">{n.message}</div>
                    <small className="text-secondary" style={{ fontSize: '0.75rem' }}>
                      {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
                    </small>
                  </div>
                  <div className="d-flex gap-2">
                    {!n.isRead && (
                      <button
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => handleMarkRead(n.id)}
                        title="Mark as read"
                      >
                        <i className="bi bi-check2"></i>
                      </button>
                    )}
                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => handleDelete(n.id)}
                      title="Delete notification"
                    >
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
