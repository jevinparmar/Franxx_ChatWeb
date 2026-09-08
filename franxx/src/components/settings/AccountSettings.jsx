import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Input from '../common/Input';
import Button from '../common/Button';
import { RiUserLine, RiLockLine } from 'react-icons/ri';
import './settings.css';

const AccountSettings = () => {
  const { user, updateUser } = useAuth();
  
  // Profile form state
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    username: user?.username || '',
    bio: user?.bio || ''
  });
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const handleProfileChange = (e) => {
    setProfileData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setProfileSuccess(false);
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    let cleanedUsername = profileData.username.trim();
    if (!cleanedUsername.startsWith('@')) {
      cleanedUsername = `@${cleanedUsername}`;
    }

    updateUser({
      name: profileData.name.trim(),
      username: cleanedUsername,
      bio: profileData.bio.trim()
    });

    setProfileSuccess(true);
    setTimeout(() => setProfileSuccess(false), 3000);
  };

  const handlePasswordChange = (e) => {
    setPasswordData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setPasswordError('');
    setPasswordSuccess(false);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('Please fill in all fields');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setPasswordSuccess(true);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setTimeout(() => setPasswordSuccess(false), 3000);
  };

  return (
    <div className="animate-fade">
      {/* Edit Profile Form */}
      <div className="settings-section-card">
        <h3 className="settings-section-title">
          <RiUserLine size={18} color="var(--accent-color)" /> Edit Profile Details
        </h3>
        
        <form onSubmit={handleProfileSubmit}>
          <div className="settings-form-row">
            <Input
              label="Full Name"
              name="name"
              value={profileData.name}
              onChange={handleProfileChange}
              required
            />
            <Input
              label="Username"
              name="username"
              value={profileData.username}
              onChange={handleProfileChange}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Bio / Headline</label>
            <textarea
              name="bio"
              value={profileData.bio}
              onChange={handleProfileChange}
              className="input-field"
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
            {profileSuccess && <span style={{ fontSize: '13px', color: 'var(--success-green)', fontWeight: '500' }}>Profile updated successfully!</span>}
            {!profileSuccess && <div></div>}
            <Button type="submit">Save Profile</Button>
          </div>
        </form>
      </div>

      {/* Change Password Form */}
      <div className="settings-section-card">
        <h3 className="settings-section-title">
          <RiLockLine size={18} color="var(--accent-color)" /> Change Password
        </h3>
        
        <form onSubmit={handlePasswordSubmit}>
          <Input
            label="Current Password"
            type="password"
            name="currentPassword"
            value={passwordData.currentPassword}
            onChange={handlePasswordChange}
            placeholder="••••••••"
          />

          <div className="settings-form-row">
            <Input
              label="New Password"
              type="password"
              name="newPassword"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              placeholder="••••••••"
            />
            <Input
              label="Confirm New Password"
              type="password"
              name="confirmPassword"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              placeholder="••••••••"
            />
          </div>

          {passwordError && <div className="input-error" style={{ marginBottom: '12px' }}>{passwordError}</div>}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
            {passwordSuccess && <span style={{ fontSize: '13px', color: 'var(--success-green)', fontWeight: '500' }}>Password changed successfully!</span>}
            {!passwordSuccess && <div></div>}
            <Button type="submit">Update Password</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AccountSettings;
