import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { getUserById, toggleFollowUser } from '../services/userService';
import { accessChat } from '../services/chatService';
import ProfileHeader from '../components/profile/ProfileHeader';
import { RiHeartFill, RiChat3Fill } from 'react-icons/ri';
import '../components/profile/profile.css';

const UserProfilePage = () => {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const { showToast } = useSocket();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('posts');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const data = await getUserById(id);
        setUser(data);
      } catch (error) {
        console.error('Failed to load user profile:', error);
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchUser();
    }
  }, [id, currentUser]);

  const handleMessageClick = async () => {
    const targetUserId = user?._id || user?.id || id;
    if (!targetUserId) return;
    try {
      const chat = await accessChat(targetUserId);
      navigate(`/dashboard?chat=${chat._id}`, { state: { newChat: chat } });
    } catch (error) {
      console.error('Failed to start chat:', error);
      const errMsg = error.response?.data?.message || error.message || 'Failed to start chat';
      showToast({
        title: 'Chat Error',
        message: errMsg,
        type: 'notification'
      });
    }
  };

  const handleFollowToggle = async () => {
    try {
      await toggleFollowUser(id);
      const data = await getUserById(id);
      setUser(data);
    } catch (error) {
      console.error('Failed to toggle follow status:', error);
    }
  };

  const getGalleryContent = () => {
    if (!user) return [];
    switch (activeTab) {
      case 'media':
        return user.media || [];
      case 'likes':
        return user.likes || [];
      case 'posts':
      default:
        return user.posts || [];
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', color: 'var(--text-secondary)' }}>Retrieving pilot profile credentials...</div>;
  }

  if (!user) {
    return <div style={{ padding: '40px', color: 'var(--text-secondary)' }}>Pilot profile not found.</div>;
  }

  const galleryItems = getGalleryContent();

  const formattedUserObj = {
    id: user._id,
    name: user.name,
    username: user.username,
    avatar: user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    bio: user.bio || 'Pilot registered to the Franxx network.',
    status: user.status || 'Offline',
    postsCount: user.postsCount || 0,
    followersCount: user.followers?.length || 0,
    followingCount: user.following?.length || 0,
    followers: user.followers || [],
    following: user.following || [],
  };

  const isOwnProfile = currentUser?._id === user._id;

  return (
    <div className="profile-container animate-fade">
      <ProfileHeader
        user={formattedUserObj}
        isOwnProfile={isOwnProfile}
        following={user.isFollowing}
        requested={user.hasRequested}
        onFollowToggle={handleFollowToggle}
        onMessageClick={handleMessageClick}
        onBackClick={() => navigate(-1)}
      />

      {/* Tabs Menu */}
      <div className="profile-tabs-wrapper">
        <button
          className={`profile-tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          Posts
        </button>
        <button
          className={`profile-tab-btn ${activeTab === 'media' ? 'active' : ''}`}
          onClick={() => setActiveTab('media')}
        >
          Media
        </button>
        <button
          className={`profile-tab-btn ${activeTab === 'likes' ? 'active' : ''}`}
          onClick={() => setActiveTab('likes')}
        >
          Likes
        </button>
      </div>

      {/* 3-Column Image Gallery */}
      <div className="profile-gallery-container">
        {galleryItems.length > 0 ? (
          <div className="profile-image-grid">
            {galleryItems.map((item) => (
              <div key={item.id} className="gallery-card">
                <img 
                  src={item.image || item.url} 
                  alt={`Gallery item ${item.id}`} 
                  loading="lazy"
                />
                <div className="gallery-overlay">
                  <div className="gallery-overlay-stat">
                    <RiHeartFill size={18} />
                    <span>{item.likes ? item.likes.toLocaleString() : (item.id * 1234)}</span>
                  </div>
                  <div className="gallery-overlay-stat">
                    <RiChat3Fill size={18} />
                    <span>{item.comments ? item.comments : (item.id * 45)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
            No content available for this tab.
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfilePage;
