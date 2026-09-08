import { useState } from 'react';
import { RiShieldKeyholeLine } from 'react-icons/ri';
import { useAuth } from '../../context/AuthContext';
import './settings.css';

const PrivacySettings = () => {
  const { user, updateUser } = useAuth();
  const [privacyOptions, setPrivacyOptions] = useState({
    showOnlineStatus: true,
    readReceipts: true,
    allowDirectMessages: true,
    shareCrashReports: false
  });

  const handleToggle = (option) => {
    setPrivacyOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  const handlePrivacyToggle = async () => {
    try {
      await updateUser({ isPrivate: !user?.isPrivate });
    } catch (err) {
      console.error("Failed to toggle private account:", err);
    }
  };

  return (
    <div className="settings-section-card animate-fade">
      <h3 className="settings-section-title">
        <RiShieldKeyholeLine size={18} color="var(--accent-color)" /> Privacy & Security Controls
      </h3>
      
      <div className="settings-toggle-row">
        <div className="settings-toggle-label">
          <span className="settings-toggle-title">Private Account</span>
          <span className="settings-toggle-desc">When your account is private, other pilots must request to follow you.</span>
        </div>
        <label className="switch">
          <input 
            type="checkbox" 
            checked={user?.isPrivate || false} 
            onChange={handlePrivacyToggle}
          />
          <span className="slider"></span>
        </label>
      </div>
      
      <div className="settings-toggle-row">
        <div className="settings-toggle-label">
          <span className="settings-toggle-title">Show Active Status</span>
          <span className="settings-toggle-desc">Allow others to see when you are online in the squad roster.</span>
        </div>
        <label className="switch">
          <input 
            type="checkbox" 
            checked={privacyOptions.showOnlineStatus} 
            onChange={() => handleToggle('showOnlineStatus')}
          />
          <span className="slider"></span>
        </label>
      </div>

      <div className="settings-toggle-row">
        <div className="settings-toggle-label">
          <span className="settings-toggle-title">Read Receipts</span>
          <span className="settings-toggle-desc">Show when you have viewed messages from teammates.</span>
        </div>
        <label className="switch">
          <input 
            type="checkbox" 
            checked={privacyOptions.readReceipts} 
            onChange={() => handleToggle('readReceipts')}
          />
          <span className="slider"></span>
        </label>
      </div>

      <div className="settings-toggle-row">
        <div className="settings-toggle-label">
          <span className="settings-toggle-title">Allow DMs from Non-Squadmates</span>
          <span className="settings-toggle-desc">Allow pilots outside your squad to message you directly.</span>
        </div>
        <label className="switch">
          <input 
            type="checkbox" 
            checked={privacyOptions.allowDirectMessages} 
            onChange={() => handleToggle('allowDirectMessages')}
          />
          <span className="slider"></span>
        </label>
      </div>

      <div className="settings-toggle-row">
        <div className="settings-toggle-label">
          <span className="settings-toggle-title">Share Diagnostic Sync Feed</span>
          <span className="settings-toggle-desc">Automatically upload piloting logs to APE headquarters.</span>
        </div>
        <label className="switch">
          <input 
            type="checkbox" 
            checked={privacyOptions.shareCrashReports} 
            onChange={() => handleToggle('shareCrashReports')}
          />
          <span className="slider"></span>
        </label>
      </div>
    </div>
  );
};

export default PrivacySettings;
