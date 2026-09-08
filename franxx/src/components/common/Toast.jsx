import { useEffect } from 'react';
import './common.css';

const Toast = ({ message, type = 'info', onClose, duration = 3000 }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div className={`toast-notification toast-${type} animate-slide-down`}>
      <span className="toast-message">{message}</span>
      {onClose && (
        <button type="button" className="toast-close-btn" onClick={onClose}>
          &times;
        </button>
      )}
    </div>
  );
};

export default Toast;
