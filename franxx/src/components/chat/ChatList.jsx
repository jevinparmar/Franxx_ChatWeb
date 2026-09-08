import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ChatCard from './ChatCard';
import ConfirmModal from '../common/ConfirmModal';
import CreateGroupModal from './CreateGroupModal';
import { useConversationSelection } from '../../hooks/useConversationSelection';
import { RiSearchLine, RiMore2Fill, RiDeleteBinLine, RiVolumeMuteLine, RiCloseLine, RiCheckDoubleLine, RiGroupLine } from 'react-icons/ri';
import './chat.css';

const ChatList = ({ 
  chats = [], 
  activeChatId, 
  onSelectChat,
  onDeleteChat,
  onBlockUser,
  onMuteChat,
  onPinChat,
  onArchiveChat,
  onClearChat,
  onBulkAction,
  onCreateGroup
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread' | 'groups'
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const menuRef = useRef(null);

  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    danger: true,
  });

  const {
    selectedChatIds,
    isSelectionMode,
    toggleSelectChat,
    selectAll,
    clearSelection,
  } = useConversationSelection(chats);

  // Close three-dot menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter conversations
  const filteredChats = chats.filter(chat => {
    const chatName = chat.name || 'Unknown User';
    const matchesSearch = chatName.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (activeTab === 'unread') {
      return chat.unread > 0;
    } else if (activeTab === 'groups') {
      return chat.type === 'group';
    }
    
    return true;
  });

  const handleMenuAction = (action, chat) => {
    const chatId = chat.id || chat._id;
    if (action === 'view_profile') {
      if (chat.otherUserId) navigate(`/user/${chat.otherUserId}`);
      else navigate('/profile');
    } else if (action === 'delete') {
      setConfirmConfig({
        isOpen: true,
        title: 'Delete Conversation',
        message: `Delete conversation with ${chat.name || 'this user'}?`,
        danger: true,
        onConfirm: () => {
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          if (onDeleteChat) onDeleteChat(chatId);
        }
      });
    } else if (action === 'block') {
      setConfirmConfig({
        isOpen: true,
        title: 'Block User',
        message: `Are you sure you want to block ${chat.name || 'this user'}?`,
        danger: true,
        onConfirm: () => {
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          if (onBlockUser && chat.otherUserId) onBlockUser(chat.otherUserId);
        }
      });
    } else if (action === 'mute') {
      if (onMuteChat) onMuteChat(chatId);
    } else if (action === 'pin') {
      if (onPinChat) onPinChat(chatId);
    } else if (action === 'archive') {
      if (onArchiveChat) onArchiveChat(chatId);
    } else if (action === 'clear') {
      setConfirmConfig({
        isOpen: true,
        title: 'Clear Chat Messages',
        message: `Are you sure you want to clear all message history for ${chat.name || 'this conversation'}?`,
        danger: true,
        onConfirm: () => {
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          if (onClearChat) onClearChat(chatId);
        }
      });
    }
  };

  const handleBulkDelete = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Conversations',
      message: `Delete ${selectedChatIds.length} selected conversations?`,
      danger: true,
      onConfirm: () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        if (onBulkAction) onBulkAction(selectedChatIds, 'delete');
        clearSelection();
      }
    });
  };

  const handleBulkMute = () => {
    if (onBulkAction) onBulkAction(selectedChatIds, 'mute');
    clearSelection();
  };

  return (
    <div className="chat-list-panel">
      {isSelectionMode ? (
        <div className="chat-selection-toolbar animate-fade">
          <div className="selection-info">
            <span className="selection-count">{selectedChatIds.length} selected</span>
          </div>
          <div className="selection-actions">
            <button type="button" onClick={selectAll} title="Select All" className="selection-btn">
              <RiCheckDoubleLine size={18} />
            </button>
            <button type="button" onClick={handleBulkMute} title="Mute" className="selection-btn">
              <RiVolumeMuteLine size={18} />
            </button>
            <button type="button" onClick={handleBulkDelete} title="Delete" className="selection-btn danger-btn">
              <RiDeleteBinLine size={18} />
            </button>
            <button type="button" onClick={clearSelection} title="Cancel" className="selection-btn">
              <RiCloseLine size={18} />
            </button>
          </div>
        </div>
      ) : (
        <div className="chat-list-header">
          <div className="chat-list-title-row">
            <h2 className="chat-list-title">Franxx</h2>
            <button
              type="button"
              className="create-group-btn"
              onClick={() => setShowCreateGroup(true)}
              title="Create Group Chat"
            >
              <RiGroupLine size={14} />
              New Group
            </button>
            <div className="mobile-header-menu" ref={menuRef}>
              <button 
                type="button"
                className="mobile-menu-btn" 
                onClick={() => setShowMenu(prev => !prev)}
                title="More options"
              >
                <RiMore2Fill size={20} />
              </button>
              {showMenu && (
                <div className="mobile-dropdown-menu animate-scale">
                  <button 
                    type="button"
                    className="mobile-dropdown-item" 
                    onClick={() => {
                      setShowMenu(false);
                      navigate('/profile');
                    }}
                  >
                    Profile
                  </button>
                  <button 
                    type="button"
                    className="mobile-dropdown-item" 
                    onClick={() => {
                      setShowMenu(false);
                      navigate('/settings');
                    }}
                  >
                    Settings
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="chat-list-search">
            <span className="chat-list-search-icon">
              <RiSearchLine size={18} />
            </span>
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="chat-list-search-input"
            />
          </div>
        </div>
      )}

      <div className="chat-list-tabs">
        <button 
          className={`chat-tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All
        </button>
        <button 
          className={`chat-tab ${activeTab === 'unread' ? 'active' : ''}`}
          onClick={() => setActiveTab('unread')}
        >
          Unread
        </button>
        <button 
          className={`chat-tab ${activeTab === 'groups' ? 'active' : ''}`}
          onClick={() => setActiveTab('groups')}
        >
          Groups
        </button>
      </div>

      <div className="chat-scroll-area">
        {filteredChats.length > 0 ? (
          filteredChats.map(chat => (
            <ChatCard
              key={chat.id || chat._id}
              chat={chat}
              active={activeChatId === (chat.id || chat._id)}
              onClick={() => onSelectChat(chat.id || chat._id)}
              isSelectionMode={isSelectionMode}
              isSelected={selectedChatIds.includes(chat.id || chat._id)}
              onToggleSelect={toggleSelectChat}
              onMenuAction={handleMenuAction}
            />
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-secondary)', fontSize: '13px' }}>
            No conversations found
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        danger={confirmConfig.danger}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />

      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onCreateGroup={onCreateGroup}
      />
    </div>
  );
};

export default ChatList;
