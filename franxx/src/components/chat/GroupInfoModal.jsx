import { useState, useEffect, useCallback } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { searchUsers } from '../../services/userService';
import { addToGroup, removeFromGroup, fetchChatMedia } from '../../services/chatService';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { RiCloseLine, RiUserAddLine, RiUserLine, RiSearchLine, RiCheckLine, RiLogoutBoxRLine, RiShieldLine, RiPlayFill, RiAttachmentLine } from 'react-icons/ri';
import './chat.css';

const GroupInfoModal = ({ isOpen, onClose, chat, onChatUpdated }) => {
  const { user: currentUser } = useAuth();
  const { showToast } = useSocket();
  const [activeTab, setActiveTab] = useState('roster'); // 'roster' or 'media'
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [chatMedia, setChatMedia] = useState({ images: [], videos: [], files: [] });
  const [loadingMedia, setLoadingMedia] = useState(false);

  // Group Details
  const groupAdminId = chat?.groupAdmin?._id || chat?.groupAdmin;
  const isAdmin = groupAdminId?.toString() === currentUser?._id?.toString();

  // Search users to add
  const handleSearch = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const results = await searchUsers(query);
      const existingMemberIds = chat?.members?.map(m => (m._id || m).toString()) || [];
      setSearchResults(results.filter(u => !existingMemberIds.includes(u._id.toString())));
    } catch (err) {
      console.error('Failed to search users:', err);
    } finally {
      setSearching(false);
    }
  }, [chat?.members]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, handleSearch]);

  // Fetch shared media
  useEffect(() => {
    if (!chat || activeTab !== 'media') return;
    const loadMedia = async () => {
      setLoadingMedia(true);
      try {
        const mediaData = await fetchChatMedia(chat.id || chat._id);
        setChatMedia(mediaData);
      } catch (err) {
        console.error('Failed to load chat media:', err);
      } finally {
        setLoadingMedia(false);
      }
    };
    loadMedia();
  }, [chat, activeTab]);

  const handleAddMember = async (userId, userName) => {
    setUpdating(true);
    try {
      const response = await addToGroup(chat.id || chat._id, userId);
      if (response && response.status === 'pending_approval') {
        showToast({
          title: 'Request Sent',
          message: response.message || 'Request sent to squad administrator for approval.',
          type: 'notification'
        });
      } else {
        onChatUpdated(response);
        showToast({
          title: 'Squad Member Added',
          message: `${userName} was successfully added to the group.`,
          type: 'notification'
        });
      }
      setSearchTerm('');
      setSearchResults([]);
    } catch (err) {
      console.error('Failed to add member:', err);
      alert(err.response?.data?.message || err.message || 'Failed to add member');
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveMember = async (userId, userName) => {
    const confirmRemove = window.confirm(`Are you sure you want to remove ${userName} from the squad?`);
    if (!confirmRemove) return;

    setUpdating(true);
    try {
      const updatedChat = await removeFromGroup(chat.id || chat._id, userId);
      onChatUpdated(updatedChat);
      showToast({
        title: 'Member Removed',
        message: `${userName} has been removed from the squad.`,
        type: 'notification'
      });
    } catch (err) {
      console.error('Failed to remove member:', err);
      alert(err.response?.data?.message || err.message || 'Failed to remove member');
    } finally {
      setUpdating(false);
    }
  };

  const handleLeaveGroup = async () => {
    const confirmLeave = window.confirm('Are you sure you want to leave this group chat?');
    if (!confirmLeave) return;

    setUpdating(true);
    try {
      await removeFromGroup(chat.id || chat._id, currentUser._id);
      showToast({
        title: 'Squad Left',
        message: `You successfully left ${chat.name}.`,
        type: 'notification'
      });
      onClose();
      onChatUpdated(null); // Triggers parent to close active conversation panel
    } catch (err) {
      console.error('Failed to leave group:', err);
      alert(err.response?.data?.message || err.message || 'Failed to leave group');
    } finally {
      setUpdating(false);
    }
  };

  if (!chat) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Group Specifications">
      <div className="group-info-layout">
        {/* Header Details */}
        <div className="group-info-header" style={{ paddingBottom: '0.75rem', borderBottom: 'none' }}>
          <img src={chat.avatar} alt={chat.name} className="group-info-avatar" />
          <h3 className="group-info-name">{chat.name}</h3>
          <span className="group-info-members-count">{chat.members?.length || 0} members</span>
        </div>

        {/* Tab Selection */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', margin: '0 -1.5rem 1.25rem -1.5rem', padding: '0 1.5rem' }}>
          <button 
            type="button" 
            onClick={() => setActiveTab('roster')}
            style={{ 
              flex: 1, 
              padding: '10px 0', 
              background: 'none', 
              border: 'none', 
              borderBottom: activeTab === 'roster' ? '2px solid var(--accent-color)' : '2px solid transparent',
              color: activeTab === 'roster' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all var(--transition-fast)'
            }}
          >
            Roster ({chat.members?.length || 0})
          </button>
          <button 
            type="button" 
            onClick={() => setActiveTab('media')}
            style={{ 
              flex: 1, 
              padding: '10px 0', 
              background: 'none', 
              border: 'none', 
              borderBottom: activeTab === 'media' ? '2px solid var(--accent-color)' : '2px solid transparent',
              color: activeTab === 'media' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all var(--transition-fast)'
            }}
          >
            Shared Media
          </button>
        </div>

        {activeTab === 'roster' && (
          <>
            {/* Add Members section */}
            <div className="group-info-section">
              <h4 className="group-info-section-title">{isAdmin ? 'Add Member' : 'Request Member Addition'}</h4>
              <div className="create-group-input-wrap">
                <RiSearchLine className="create-group-input-icon" size={18} />
                <input
                  type="text"
                  placeholder={isAdmin ? "Search users to add..." : "Search users to request adding..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="create-group-input"
                />
              </div>

              {searchTerm.length >= 2 && (
                <div className="create-group-results" style={{ marginTop: '8px', maxHeight: '160px' }}>
                  {searching ? (
                    <div className="create-group-searching">Searching...</div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map(u => (
                      <div
                        className="create-group-result-item"
                        key={u._id}
                        onClick={() => handleAddMember(u._id, u.name)}
                      >
                        <img src={u.avatar} alt="" className="create-group-result-avatar" />
                        <div className="create-group-result-info">
                          <span className="create-group-result-name">{u.name}</span>
                          <span className="create-group-result-username">{u.username}</span>
                        </div>
                        <RiUserAddLine className="create-group-result-add" size={18} style={{ color: 'var(--accent-color)' }} />
                      </div>
                    ))
                  ) : (
                    <div className="create-group-searching">No squad members found</div>
                  )}
                </div>
              )}
            </div>

            {/* Roster list */}
            <div className="group-info-section">
              <h4 className="group-info-section-title">Squad Members Roster</h4>
              <div className="group-info-members-list">
                {chat.members?.map(member => {
                  const mId = member._id || member;
                  const isMemberAdmin = mId.toString() === groupAdminId?.toString();
                  const isSelf = mId.toString() === currentUser?._id?.toString();

                  return (
                    <div className="group-info-member-item" key={mId}>
                      <img src={member.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'} alt="" className="group-info-member-avatar" />
                      <div className="group-info-member-details">
                        <span className="group-info-member-name">{member.name || 'Squad Member'}</span>
                        <span className="group-info-member-role">
                          {isMemberAdmin && (
                            <span className="admin-badge">
                              <RiShieldLine size={12} /> Admin
                            </span>
                          )}
                          {member.username}
                        </span>
                      </div>

                      {/* Remove action button (Admin only, can't remove self) */}
                      {isAdmin && !isSelf && (
                        <button
                          type="button"
                          disabled={updating}
                          onClick={() => handleRemoveMember(mId, member.name)}
                          className="group-info-remove-member-btn"
                          title="Remove from Group"
                        >
                          <RiCloseLine size={18} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {activeTab === 'media' && (
          <div className="group-info-section" style={{ gap: '1rem' }}>
            {loadingMedia ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                Scanning log for attachments...
              </div>
            ) : (
              <>
                {/* Images & Videos Grid */}
                {(chatMedia.images?.length > 0 || chatMedia.videos?.length > 0) && (
                  <div>
                    <h4 className="group-info-section-title" style={{ marginBottom: '8px' }}>Photos & Videos</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                      {chatMedia.images?.map(img => (
                        <div 
                          key={img.id} 
                          onClick={() => window.open(img.url, '_blank')}
                          style={{ aspectRatio: '1', borderRadius: '6px', overflow: 'hidden', cursor: 'pointer', backgroundColor: 'var(--bg-sec)' }}
                        >
                          <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ))}
                      {chatMedia.videos?.map(video => (
                        <div 
                          key={video.id} 
                          onClick={() => window.open(video.url, '_blank')}
                          style={{ aspectRatio: '1', borderRadius: '6px', overflow: 'hidden', cursor: 'pointer', position: 'relative', backgroundColor: 'var(--bg-sec)' }}
                        >
                          <video src={video.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted preload="metadata" />
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.3)', color: '#fff' }}>
                            <RiPlayFill size={20} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Files List */}
                {chatMedia.files?.length > 0 && (
                  <div>
                    <h4 className="group-info-section-title" style={{ marginBottom: '8px' }}>Documents & Files</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
                      {chatMedia.files.map(file => (
                        <div 
                          key={file.id} 
                          onClick={() => window.open(file.url, '_blank')}
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '10px', 
                            padding: '8px 10px', 
                            backgroundColor: 'var(--bg-sec)', 
                            borderRadius: '6px', 
                            border: '1px solid var(--border-color)',
                            cursor: 'pointer' 
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', color: 'var(--accent-color)' }}>
                            <RiAttachmentLine size={18} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
                            <span style={{ 
                              fontSize: '12px', 
                              fontWeight: '600', 
                              color: 'var(--text-primary)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {file.name.replace(/-[0-9]{13}(?=\.[a-zA-Z0-9]+$)/, '')}
                            </span>
                            <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Shared File</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {chatMedia.images?.length === 0 && chatMedia.videos?.length === 0 && chatMedia.files?.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    No shared media found in this squad log.
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Leave Group Action (Non-admins only) */}
        {!isAdmin && (
          <div className="group-info-footer">
            <Button
              variant="outline"
              disabled={updating}
              onClick={handleLeaveGroup}
              style={{ width: '100%', borderColor: '#ef4444', color: '#ef4444' }}
            >
              <RiLogoutBoxRLine size={18} style={{ marginRight: '6px' }} /> Leave Squad
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default GroupInfoModal;
