import { useState, useRef, useEffect } from 'react';
import UserAvatar from '../common/UserAvatar';
import { RiMore2Fill, RiCheckLine, RiVolumeMuteFill, RiPushpinFill } from 'react-icons/ri';
import './chat.css';

const ChatCard = ({ 
  chat, 
  active, 
  onClick, 
  isSelectionMode, 
  isSelected, 
  onToggleSelect,
  onMenuAction 
}) => {
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

  const isDeletedUser = chat.isDeletedUser || !chat.name || chat.name === 'Unknown User';
  const displayName = isDeletedUser ? 'Deleted User' : chat.name;

  const lastMsgObj = chat.messages && chat.messages.length > 0 
    ? chat.messages[chat.messages.length - 1] 
    : (chat.lastMessage || null);

  const lastMessageText = isDeletedUser 
    ? 'Conversation unavailable' 
    : (lastMsgObj ? (lastMsgObj.text || (lastMsgObj.mediaType !== 'none' ? '📷 Media' : 'No messages yet')) : 'No messages yet');

  const lastMessageTime = lastMsgObj ? (lastMsgObj.time || (lastMsgObj.createdAt ? new Date(lastMsgObj.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '')) : '';

  const handleCardClick = (e) => {
    if (isSelectionMode) {
      e.stopPropagation();
      onToggleSelect(chat.id || chat._id);
    } else if (onClick) {
      onClick(e);
    }
  };

  const handleAction = (e, action) => {
    e.stopPropagation();
    setShowMenu(false);
    if (onMenuAction) onMenuAction(action, chat);
  };

  return (
    <div 
      className={`chat-card ${active ? 'active' : ''} ${isSelected ? 'selected' : ''}`}
      onClick={handleCardClick}
    >
      {isSelectionMode && (
        <div 
          className={`chat-card-checkbox ${isSelected ? 'checked' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(chat.id || chat._id);
          }}
        >
          {isSelected && <RiCheckLine size={14} color="#FFF" />}
        </div>
      )}

      <UserAvatar
        src={chat.avatar}
        name={displayName}
        size="md"
        isDeleted={isDeletedUser}
        isOnline={chat.online || chat.status === 'Online'}
      />

      <div className="chat-card-info">
        <div className="chat-card-row1">
          <h4 className="chat-card-name" title={displayName}>{displayName}</h4>
          {lastMessageTime && <span className="chat-card-time">{lastMessageTime}</span>}
        </div>
        
        <div className="chat-card-row2">
          <p className="chat-card-message">{lastMessageText}</p>
          <div className="chat-card-badges">
            {chat.isMuted && <RiVolumeMuteFill size={14} className="chat-card-muted-icon" />}
            {chat.isPinned && <RiPushpinFill size={14} className="chat-card-pinned-icon" />}
            {chat.unread > 0 && (
              <span className="chat-card-unread-badge">{chat.unread}</span>
            )}
          </div>
        </div>
      </div>

      {!isSelectionMode && (
        <div className="chat-card-menu-wrapper" ref={menuRef} onClick={(e) => e.stopPropagation()}>
          <button 
            type="button" 
            className="chat-card-menu-btn" 
            onClick={() => setShowMenu(prev => !prev)}
            title="Options"
          >
            <RiMore2Fill size={18} />
          </button>

          {showMenu && (
            <div className="chat-card-dropdown animate-scale">
              <button type="button" onClick={(e) => handleAction(e, 'view_profile')}>View Profile</button>
              <button type="button" onClick={(e) => handleAction(e, 'mute')}>{chat.isMuted ? 'Unmute' : 'Mute Notifications'}</button>
              <button type="button" onClick={(e) => handleAction(e, 'pin')}>{chat.isPinned ? 'Unpin' : 'Pin Chat'}</button>
              <button type="button" onClick={(e) => handleAction(e, 'archive')}>Archive Chat</button>
              <button type="button" onClick={(e) => handleAction(e, 'clear')}>Clear Chat</button>
              <button type="button" className="danger-item" onClick={(e) => handleAction(e, 'delete')}>Delete Chat</button>
              <button type="button" className="danger-item" onClick={(e) => handleAction(e, 'block')}>Block User</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatCard;
