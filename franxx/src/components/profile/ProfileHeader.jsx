import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../common/Button';
import Modal from '../common/Modal';
import BackButton from '../common/BackButton';
import UserAvatar from '../common/UserAvatar';
import { RiEdit2Line, RiMessage3Line, RiUserAddLine, RiCheckLine } from 'react-icons/ri';
import './profile.css';

const ProfileHeader = ({ 
  user, 
  isOwnProfile, 
  onEditClick, 
  onMessageClick, 
  following = false, 
  requested = false, 
  onFollowToggle, 
  onBackClick 
}) => {
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const navigate = useNavigate();

  if (!user) return null;

  const handleUserClick = (userId) => {
    setShowFollowers(false);
    setShowFollowing(false);
    navigate(`/user/${userId}`);
  };

  const followersCount = user.followers?.length || 0;
  const followingCount = user.following?.length || 0;

  return (
    <div className="profile-header-container">
      {/* Banner */}
      <div className="profile-banner">
        <div className="profile-banner-overlay"></div>
        {onBackClick && (
          <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 10 }}>
            <BackButton onClick={onBackClick} label="Back" />
          </div>
        )}
      </div>

      {/* Header Info */}
      <div className="profile-header-card">
        <div className="profile-avatar-row">
          <div className="profile-avatar-wrapper">
            <UserAvatar
              src={user.avatar}
              name={user.name}
              size="xl"
            />
          </div>

          <div className="profile-action-btn-row">
            {isOwnProfile ? (
              <Button 
                variant="outline" 
                icon={RiEdit2Line} 
                onClick={onEditClick}
              >
                Edit Profile
              </Button>
            ) : (
              <>
                <Button 
                  variant="primary" 
                  icon={RiMessage3Line} 
                  onClick={onMessageClick}
                >
                  Message
                </Button>
                <Button 
                  variant={following ? "secondary" : "outline"} 
                  icon={following ? RiCheckLine : RiUserAddLine} 
                  onClick={onFollowToggle}
                >
                  {following ? 'Following' : requested ? 'Requested' : 'Follow'}
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="profile-info">
          <div className="profile-name-row">
            <h2 className="profile-display-name">{user.name}</h2>
          </div>
          <p className="profile-username">{user.username}</p>
          {user.bio && <p className="profile-bio">{user.bio}</p>}
          
          <div className="profile-stats-row">
            <div className="profile-stat-item">
              <span className="profile-stat-value">{user.postsCount || user.posts?.length || 0}</span>
              <span className="profile-stat-label">Posts</span>
            </div>
            <div 
              className="profile-stat-item" 
              style={{ cursor: 'pointer' }} 
              onClick={() => setShowFollowers(true)}
            >
              <span className="profile-stat-value">{followersCount}</span>
              <span className="profile-stat-label">Followers</span>
            </div>
            <div 
              className="profile-stat-item" 
              style={{ cursor: 'pointer' }} 
              onClick={() => setShowFollowing(true)}
            >
              <span className="profile-stat-value">{followingCount}</span>
              <span className="profile-stat-label">Following</span>
            </div>
          </div>
        </div>
      </div>

      {/* Followers Modal */}
      <Modal isOpen={showFollowers} onClose={() => setShowFollowers(false)} title="Followers">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto', padding: '5px' }}>
          {user.followers && user.followers.length > 0 ? (
            user.followers.map(f => (
              <div 
                key={f._id} 
                onClick={() => handleUserClick(f._id)}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '8px', borderRadius: '8px' }}
                className="hover-effect-profile"
              >
                <UserAvatar src={f.avatar} name={f.name} size="sm" />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)' }}>{f.name}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{f.username}</span>
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>No followers yet.</div>
          )}
        </div>
      </Modal>

      {/* Following Modal */}
      <Modal isOpen={showFollowing} onClose={() => setShowFollowing(false)} title="Following">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto', padding: '5px' }}>
          {user.following && user.following.length > 0 ? (
            user.following.map(f => (
              <div 
                key={f._id} 
                onClick={() => handleUserClick(f._id)}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '8px', borderRadius: '8px' }}
                className="hover-effect-profile"
              >
                <UserAvatar src={f.avatar} name={f.name} size="sm" />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)' }}>{f.name}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{f.username}</span>
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>Not following anyone yet.</div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default ProfileHeader;
