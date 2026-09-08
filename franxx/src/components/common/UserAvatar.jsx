import { useState } from 'react';
import './common.css';

const getInitials = (name) => {
  if (!name || name === 'Deleted User' || name === 'Unknown User') return 'UN';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return 'UN';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const UserAvatar = ({ 
  src, 
  name, 
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl'
  isDeleted = false,
  isOnline = false,
  className = '',
  style = {},
}) => {
  const [imageError, setImageError] = useState(false);

  const displayName = isDeleted ? 'Deleted User' : (name || 'Unknown User');
  const initials = getInitials(displayName);
  const showFallback = isDeleted || !src || imageError;

  return (
    <div 
      className={`user-avatar-wrapper size-${size} ${className}`}
      style={style}
      title={displayName}
    >
      {showFallback ? (
        <div className={`user-avatar-fallback ${isDeleted ? 'deleted' : ''}`}>
          {initials}
        </div>
      ) : (
        <img
          src={src}
          alt={displayName}
          className="user-avatar-img"
          onError={() => setImageError(true)}
          loading="lazy"
        />
      )}
      {isOnline && !isDeleted && <span className="user-avatar-online-badge"></span>}
    </div>
  );
};

export default UserAvatar;
