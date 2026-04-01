import React, { useEffect, useState, useCallback } from 'react';
import './Notification.css';

const Notification = ({
  message,
  type = 'info',
  duration = 5000,
  onClose,
  position = 'top-right'
}) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      if (onClose) onClose();
    }, 300);
  }, [onClose]);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, handleClose]);

  if (!isVisible) return null;

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };

  return (
    <div className={`notification notification-${type} notification-${position}`}>
      <div className="notification-icon">{icons[type]}</div>
      <div className="notification-content">
        <p>{message}</p>
      </div>
      <button className="notification-close" onClick={handleClose}>
        ✕
      </button>
    </div>
  );
};

export default Notification;