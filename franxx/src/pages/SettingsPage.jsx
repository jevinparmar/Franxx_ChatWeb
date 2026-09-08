import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AccountSettings from '../components/settings/AccountSettings';
import PrivacySettings from '../components/settings/PrivacySettings';
import ThemeSettings from '../components/settings/ThemeSettings';
import ChangePasswordSettings from '../components/settings/ChangePasswordSettings';
import BlockedUsersSettings from '../components/settings/BlockedUsersSettings';
import { 
  RiArrowLeftLine, 
  RiUserFill, 
  RiLockPasswordFill, 
  RiShieldKeyholeFill, 
  RiNotification3Fill, 
  RiSunFill, 
  RiTranslate2, 
  RiForbidFill, 
  RiQuestionFill, 
  RiLogoutBoxRFill 
} from 'react-icons/ri';
import '../components/settings/settings.css';

import BackButton from '../components/common/BackButton';

const SettingsPage = () => {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Extract selected settings tab from query param `?tab=xxx`
  const queryParams = new URLSearchParams(location.search);
  const activeTab = queryParams.get('tab') || 'appearance'; // default is appearance

  const handleTabChange = (tabId) => {
    navigate(`/settings?tab=${tabId}`);
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out of FRANXX?')) {
      logout();
      navigate('/login');
    }
  };

  const handleBackToMenu = () => {
    navigate('/settings');
  };

  const handleBackToPrev = () => {
    navigate(-1);
  };

  // Determine what component to render on the right side
  const renderContent = () => {
    switch (activeTab) {
      case 'account':
        return <AccountSettings />;
      case 'security':
        return <ChangePasswordSettings />;
      case 'privacy':
        return <PrivacySettings />;
      case 'appearance':
        return <ThemeSettings />;
      case 'notifications':
        return (
          <div className="settings-section-card animate-fade">
            <h3 className="settings-section-title"><RiNotification3Fill size={18} color="var(--accent-color)" /> Notification Preferences</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Notification settings are synchronized with client-side mock timers. Alerts will show in the dashboard chat tabs.</p>
          </div>
        );
      case 'language':
        return (
          <div className="settings-section-card animate-fade">
            <h3 className="settings-section-title"><RiTranslate2 size={18} color="var(--accent-color)" /> Language</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Default system language is set to English (Franxx-US). Syncing localization files...</p>
          </div>
        );
      case 'blocked':
        return <BlockedUsersSettings />;
      case 'help':
        return (
          <div className="settings-section-card animate-fade">
            <h3 className="settings-section-title"><RiQuestionFill size={18} color="var(--accent-color)" /> Help & Support Center</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Franxx System client version 1.0.0. If you encounter sync failures, check your core connection or restart the simulator.</p>
          </div>
        );
      default:
        return <ThemeSettings />;
    }
  };

  // Human readable title helper
  const getTabTitle = () => {
    switch (activeTab) {
      case 'account': return 'Account Settings';
      case 'security': return 'Change Password';
      case 'privacy': return 'Privacy & Security';
      case 'appearance': return 'Appearance Preferences';
      case 'notifications': return 'Notifications';
      case 'language': return 'Language Settings';
      case 'blocked': return 'Blocked Users';
      case 'help': return 'Help & Support';
      default: return 'Settings';
    }
  };

  // Determine if details are active for mobile stack check (checks if search has ?tab=)
  const isDetailActive = location.search.includes('tab=');

  return (
    <div className="settings-page-layout animate-fade">
      {/* Left Settings Sidebar Menu */}
      <div className="settings-menu-panel" style={{ display: (!isDetailActive || window.innerWidth > 1024) ? 'flex' : 'none' }}>
        <div className="settings-header" style={{ display: 'flex', alignItems: 'center' }}>
          <button 
            type="button"
            onClick={handleBackToPrev}
            className="back-button-mobile-global"
            aria-label="Back"
            style={{ 
              display: 'none', 
              alignItems: 'center', 
              justifyContent: 'center',  
              color: 'var(--text-secondary)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: 'var(--radius-full)',
              marginRight: '0.5rem',
              transition: 'all var(--transition-fast)'
            }}
          >
            <RiArrowLeftLine size={20} />
          </button>
          <h2 className="settings-title">Settings</h2>
        </div>

        <div className="settings-menu-scroll">
          {/* Account Category */}
          <div className="settings-menu-section">
            <span className="settings-menu-header">Account</span>
            
            <button 
              className={`settings-menu-item ${activeTab === 'account' ? 'active' : ''}`}
              onClick={() => handleTabChange('account')}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RiUserFill size={18} /> Edit Profile
              </span>
            </button>

            <button 
              className={`settings-menu-item ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => handleTabChange('security')}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RiLockPasswordFill size={18} /> Change Password
              </span>
            </button>

            <button 
              className={`settings-menu-item ${activeTab === 'privacy' ? 'active' : ''}`}
              onClick={() => handleTabChange('privacy')}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RiShieldKeyholeFill size={18} /> Privacy
              </span>
            </button>
          </div>

          {/* Preferences Category */}
          <div className="settings-menu-section">
            <span className="settings-menu-header">Preferences</span>

            <button 
              className={`settings-menu-item ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => handleTabChange('notifications')}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RiNotification3Fill size={18} /> Notifications
              </span>
            </button>

            <button 
              className={`settings-menu-item ${activeTab === 'appearance' ? 'active' : ''}`}
              onClick={() => handleTabChange('appearance')}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RiSunFill size={18} /> Appearance
              </span>
            </button>

            <button 
              className={`settings-menu-item ${activeTab === 'language' ? 'active' : ''}`}
              onClick={() => handleTabChange('language')}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RiTranslate2 size={18} /> Language
              </span>
            </button>
          </div>

          {/* Others Category */}
          <div className="settings-menu-section">
            <span className="settings-menu-header">Others</span>

            <button 
              className={`settings-menu-item ${activeTab === 'blocked' ? 'active' : ''}`}
              onClick={() => handleTabChange('blocked')}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RiForbidFill size={18} /> Blocked Users
              </span>
            </button>

            <button 
              className={`settings-menu-item ${activeTab === 'help' ? 'active' : ''}`}
              onClick={() => handleTabChange('help')}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RiQuestionFill size={18} /> Help & Support
              </span>
            </button>

            <button 
              className="settings-menu-item danger"
              onClick={handleLogout}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RiLogoutBoxRFill size={18} /> Logout
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Right side Detail Content Area */}
      <div className="settings-content-pane" style={{ display: (isDetailActive || window.innerWidth > 1024) ? 'block' : 'none' }}>
        <div className="settings-content-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            {isDetailActive && (
              <button 
                onClick={handleBackToMenu}
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  color: 'var(--text-secondary)',
                  cursor: 'pointer' 
                }}
                className="back-button-mobile-settings"
                aria-label="Back to settings categories"
              >
                <RiArrowLeftLine size={20} />
              </button>
            )}
            <h2 className="settings-content-title">{getTabTitle()}</h2>
          </div>
          <span className="settings-content-subtitle">Manage settings configurations for your FRANXX application feed.</span>
        </div>

        {renderContent()}
      </div>

      <style>{`
        .back-button-mobile-settings {
          display: none;
        }
        @media (max-width: 1024px) {
          .back-button-mobile-settings {
            display: inline-flex;
          }
          .back-button-mobile-global {
            display: flex !important;
          }
        }
        .back-button-mobile-global:hover {
          background-color: var(--bg-sec);
          color: var(--text-primary);
        }
      `}</style>
    </div>
  );
};

export default SettingsPage;
