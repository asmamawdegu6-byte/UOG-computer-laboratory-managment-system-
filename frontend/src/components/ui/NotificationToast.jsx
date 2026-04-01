import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationContext';
import './NotificationToast.css';

const ToastItem = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = useState(true);
  const navigate = useNavigate();

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => onRemove(toast.id), 300);
  }, [onRemove, toast.id]);

  useEffect(() => {
    if (toast.duration > 0) {
      const timer = setTimeout(handleClose, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.duration, handleClose]);

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: '🔔'
  };

  const handleAction = () => {
    if (toast.link) {
      navigate(toast.link);
    }
    handleClose();
  };

  return (
    <div className={`toast-item toast-${toast.type} ${isVisible ? 'toast-visible' : 'toast-hidden'}`}>
      <div className="toast-icon">{icons[toast.type] || icons.info}</div>
      <div className="toast-body">
        {toast.title && <div className="toast-title">{toast.title}</div>}
        <div className="toast-message">{toast.message}</div>
        {toast.link && (
          <button className="toast-action" onClick={handleAction}>
            View Details →
          </button>
        )}
      </div>
      <button className="toast-close" onClick={handleClose}>✕</button>
    </div>
  );
};

const NotificationToast = () => {
  const { toasts, removeToast } = useNotifications();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
};

export default NotificationToast;
