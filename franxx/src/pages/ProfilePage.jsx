import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProfileHeader from '../components/profile/ProfileHeader';
import EditProfileModal from '../components/profile/EditProfileModal';
import { RiHeartFill, RiChat3Fill } from 'react-icons/ri';
import '../components/profile/profile.css';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('posts'); // 'posts' | 'media' | 'likes'
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const navigate = useNavigate();

  if (!user) return null;

  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/dashboard');
    }
  };

  // Filter content based on active tab
  const getGalleryContent = () => {
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

  const galleryItems = getGalleryContent();

  return (
    <div className="profile-container animate-fade">
      <ProfileHeader
        user={user}
        isOwnProfile={true}
        onEditClick={() => setIsEditModalOpen(true)}
        onBackClick={handleBack}
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
                
                {/* Visual hover overlay stats */}
                <div className="gallery-overlay">
                  <div className="gallery-overlay-stat">
                    <RiHeartFill size={18} />
                    <span>{item.likes ? item.likes.toLocaleString() : (item.id * 1420).toLocaleString()}</span>
                  </div>
                  <div className="gallery-overlay-stat">
                    <RiChat3Fill size={18} />
                    <span>{item.comments ? item.comments : (item.id * 32)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
            No posts found.
          </div>
        )}
      </div>

      {/* Edit Profile Dialog */}
      {isEditModalOpen && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          user={user}
          onUpdate={updateUser}
        />
      )}
    </div>
  );
};

export default ProfilePage;
