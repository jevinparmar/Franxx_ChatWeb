import { useState, useRef, useEffect } from 'react';
import UserAvatar from '../common/UserAvatar';
import { RiCheckLine, RiCheckDoubleLine, RiMore2Fill, RiAttachmentLine } from 'react-icons/ri';
import './chat.css';

const MessageBubble = ({ message, isMe, showSenderName = false, onDeleteMessage }) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isDeleted = message.isDeletedForEveryone || message.text === 'This message was deleted';

  const handleCopy = () => {
    if (message.text) {
      navigator.clipboard.writeText(message.text);
      setShowMenu(false);
    }
  };

  const handleDelete = (forEveryone = false) => {
    setShowMenu(false);
    if (onDeleteMessage) {
      onDeleteMessage(message._id || message.id, forEveryone);
    }
  };

  return (
    <div className={`message-bubble-wrapper ${isMe ? 'sent' : 'received'}`}>
      {!isMe && (
        <UserAvatar
          src={message.senderAvatar || message.sender?.avatar}
          name={message.senderName || message.sender?.name || 'User'}
          size="sm"
        />
      )}
      
      <div className="message-bubble-content-box">
        {!isMe && showSenderName && (message.senderName || message.sender?.name) && (
          <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', marginLeft: '4px', marginBottom: '2px' }}>
            {message.senderName || message.sender?.name}
          </span>
        )}
        <div className={`message-bubble-body ${isDeleted ? 'deleted-msg' : ''}`}>
          {!isDeleted && message.mediaUrl && message.mediaType === 'image' && (
            <img 
              src={message.mediaUrl} 
              alt="Sent media" 
              style={{ maxWidth: '240px', maxHeight: '240px', borderRadius: '8px', marginBottom: '6px', cursor: 'pointer', display: 'block', objectFit: 'cover' }} 
              onClick={() => window.open(message.mediaUrl, '_blank')}
            />
          )}
          {!isDeleted && message.mediaUrl && message.mediaType === 'video' && (
            <video 
              src={message.mediaUrl} 
              controls 
              style={{ maxWidth: '240px', maxHeight: '240px', borderRadius: '8px', marginBottom: '6px', display: 'block' }} 
            />
          )}
          {!isDeleted && message.mediaUrl && (message.mediaType === 'file' || message.mediaType === 'document') && (
            <a 
              href={message.mediaUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="message-file-attachment-card"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                padding: '8px 12px', 
                borderRadius: '8px', 
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                textDecoration: 'none',
                color: 'var(--text-primary)',
                marginBottom: '6px',
                maxWidth: '240px'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', color: 'var(--accent-color, #6c5ce7)' }}>
                <RiAttachmentLine size={20} />
              </span>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
                <span style={{ 
                  fontSize: '12px', 
                  fontWeight: '600', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis', 
                  whiteSpace: 'nowrap',
                  color: 'var(--text-primary)'
                }}>
                  {(message.mediaUrl.split('/').pop() || 'Attachment').replace(/-[0-9]{13}(?=\.[a-zA-Z0-9]+$)/, '')}
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Click to open file</span>
              </div>
            </a>
          )}
          <span>{isDeleted ? 'This message was deleted' : message.text}</span>
        </div>

        <div className="message-bubble-footer" style={{ display: 'flex', alignItems: 'center', gap: '4px', alignSelf: isMe ? 'flex-end' : 'flex-start' }}>
          <span className="message-bubble-time">
            {message.time || (message.createdAt ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '')}
          </span>

          {isMe && !isDeleted && (
            <span className="message-status-icon">
              {message.status === 'seen' || (message.readBy && message.readBy.length > 1) ? (
                <RiCheckDoubleLine size={14} color="var(--accent-color)" title="Seen" />
              ) : message.status === 'delivered' ? (
                <RiCheckDoubleLine size={14} color="var(--text-secondary)" title="Delivered" />
              ) : (
                <RiCheckLine size={14} color="var(--text-secondary)" title="Sent" />
              )}
            </span>
          )}

          {/* Context menu button for message */}
          <div className="message-menu-wrapper" ref={menuRef} style={{ position: 'relative' }}>
            <button
              type="button"
              className="message-menu-btn"
              onClick={() => setShowMenu(prev => !prev)}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0 2px' }}
            >
              <RiMore2Fill size={14} />
            </button>

            {showMenu && (
              <div className="message-dropdown-menu animate-scale" style={{ position: 'absolute', bottom: '100%', right: 0, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '6px', boxShadow: 'var(--shadow-lg)', padding: '4px 0', zIndex: 10, minWidth: '130px', display: 'flex', flexDirection: 'column' }}>
                <button type="button" onClick={handleCopy} style={{ background: 'none', border: 'none', padding: '6px 12px', textAlignment: 'left', fontSize: '12px', color: 'var(--text-primary)', cursor: 'pointer' }}>Copy</button>
                <button type="button" onClick={() => handleDelete(false)} style={{ background: 'none', border: 'none', padding: '6px 12px', textAlignment: 'left', fontSize: '12px', color: 'var(--text-primary)', cursor: 'pointer' }}>Delete for me</button>
                {isMe && !isDeleted && (
                  <button type="button" onClick={() => handleDelete(true)} style={{ background: 'none', border: 'none', padding: '6px 12px', textAlignment: 'left', fontSize: '12px', color: '#EF4444', cursor: 'pointer' }}>Delete for everyone</button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
