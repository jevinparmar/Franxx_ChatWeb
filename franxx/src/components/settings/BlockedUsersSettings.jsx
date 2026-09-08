import { useState, useEffect } from 'react';
import { RiForbidFill } from 'react-icons/ri';
import { getBlockedUsers, unblockUser } from '../../services/userService';
import './settings.css';

const BlockedUsersSettings = () => {
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchBlockedUsers = async () => {
    try {
      setLoading(true);
      const data = await getBlockedUsers();
      setBlockedUsers(data);
    } catch (err) {
      console.error("Failed to fetch blocked users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlockedUsers();
  }, []);

  const handleUnblock = async (userId) => {
    try {
      await unblockUser(userId);
      fetchBlockedUsers();
    } catch (err) {
      console.error("Failed to unblock user:", err);
    }
  };

  return (
    <div className="settings-section-card animate-fade">
      <h3 className="settings-section-title">
        <RiForbidFill size={18} color="var(--accent-color)" /> Blocked Pilots
      </h3>
      
      {loading ? (
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', padding: '12px 0' }}>Retrieving blocked list...</div>
      ) : blockedUsers.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
          {blockedUsers.map(u => (
            <div key={u._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: 'var(--bg-sec)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img src={u.avatar} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{u.name}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{u.username}</span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => handleUnblock(u._id)}
                style={{ 
                  backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                  border: '1px solid rgba(239, 68, 68, 0.3)', 
                  borderRadius: 'var(--radius-sm)', 
                  color: '#ef4444', 
                  fontSize: '11px', 
                  fontWeight: '600', 
                  cursor: 'pointer',
                  padding: '5px 12px'
                }}
              >
                Unblock
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', padding: '12px 0' }}>
          No users are blocked in your squad. You can block other pilots directly from their chat settings panel.
        </div>
      )}
    </div>
  );
};

export default BlockedUsersSettings;
