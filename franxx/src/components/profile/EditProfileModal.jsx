import { useState, useRef } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import { uploadAvatar } from '../../services/userService';
import './profile.css';

const EditProfileModal = ({ isOpen, onClose, user, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    username: user?.username || '',
    bio: user?.bio || '',
    avatar: user?.avatar || ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const response = await uploadAvatar(file);
      setFormData(prev => ({ ...prev, avatar: response.avatarUrl }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAvatar = () => {
    setFormData(prev => ({
      ...prev,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.username.trim()) {
      setError('Name and Username are required');
      return;
    }

    setLoading(true);
    try {
      let cleanedUsername = formData.username.trim();
      if (!cleanedUsername.startsWith('@')) {
        cleanedUsername = `@${cleanedUsername}`;
      }

      await onUpdate({
        name: formData.name.trim(),
        username: cleanedUsername,
        bio: formData.bio.trim(),
        avatar: formData.avatar.trim() || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update profile details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Profile">
      <form onSubmit={handleSubmit} className="edit-profile-form">
        {error && <div className="input-error" style={{ textAlign: 'center', marginBottom: '8px' }}>{error}</div>}
        
        <div className="edit-profile-avatar-preview" style={{ marginBottom: '15px' }}>
          <div 
            onClick={() => fileInputRef.current?.click()}
            style={{ 
              position: 'relative', 
              cursor: 'pointer', 
              width: '60px', 
              height: '60px', 
              borderRadius: '50%', 
              overflow: 'hidden' 
            }}
          >
            <img 
              src={formData.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
              alt="Avatar preview" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            {uploading && (
              <div style={{ 
                position: 'absolute', 
                inset: 0, 
                backgroundColor: 'rgba(0,0,0,0.5)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: '#fff', 
                fontSize: '9px' 
              }}>
                Uploading...
              </div>
            )}
          </div>
          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>Avatar Photo</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()} 
                disabled={uploading}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--accent-color, #6366f1)', 
                  fontSize: '12px', 
                  fontWeight: '600', 
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                Change Photo
              </button>
              <span style={{ color: 'var(--border-color)', fontSize: '12px' }}>|</span>
              <button 
                type="button" 
                onClick={handleRemoveAvatar} 
                disabled={uploading}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: '#ef4444', 
                  fontSize: '12px', 
                  fontWeight: '600', 
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                Remove Photo
              </button>
            </div>
          </div>
        </div>

        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          style={{ display: 'none' }} 
        />

        <Input
          label="Full Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Your full name"
          required
        />

        <Input
          label="Username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          placeholder="e.g. @zerotwo"
          required
        />

        <div className="input-group">
          <label className="input-label">Bio</label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            placeholder="Tell us about yourself..."
            className="input-field"
            rows={3}
            style={{ resize: 'vertical' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '10px', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditProfileModal;
