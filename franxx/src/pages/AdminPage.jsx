import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/axios';
import {
  RiDashboardLine,
  RiUserSettingsLine,
  RiChatSettingsLine,
  RiAlertLine,
  RiImageLine,
  RiSettingsLine,
  RiLogoutBoxRLine,
  RiUserFollowLine,
  RiUserUnfollowLine,
  RiRadioButtonLine,
  RiArrowLeftLine,
  RiCheckDoubleLine
} from 'react-icons/ri';
import Button from '../components/common/Button';
import './AdminPage.css';

const AdminPage = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState('dashboard');

  const [stats, setStats] = useState({
    totalUsers: 0,
    onlineUsers: 0,
    totalMessages: 0,
    totalChats: 0
  });
  const [users, setUsers] = useState([]);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    try {
      const statsRes = await api.get('/admin/stats');
      setStats(statsRes.data);

      const usersRes = await api.get('/admin/users');
      setUsers(usersRes.data.map(u => ({
        id: u._id,
        name: u.name,
        username: u.username,
        email: u.email,
        role: u.role === 'admin' ? 'Admin' : 'User',
        joined: new Date(u.createdAt).toLocaleDateString(),
        status: u.status || 'Offline',
        avatar: u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
        followers: u.followers?.length || 0,
        following: u.following?.length || 0,
        isPrivate: u.isPrivate || false
      })));

      const chatsRes = await api.get('/admin/chats');
      setChats(chatsRes.data.map(c => ({
        id: c._id,
        name: c.name === 'individual' ? c.members.map(m => m.name).join(' & ') : c.name,
        type: c.type === 'group' ? 'Group' : 'Individual',
        members: c.members?.length || 0,
        messageCount: c.messageCount || 0,
        lastActive: c.lastMessage
          ? new Date(c.lastMessage.createdAt).toLocaleString()
          : 'No activity',
        createdAt: new Date(c.createdAt).toLocaleDateString(),
        status: 'Active'
      })));

      setLoading(false);
    } catch (error) {
      console.error('Failed to load admin data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleActionUser = async (userId, currentStatus) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return { ...u, status: currentStatus === 'Online' ? 'Offline' : 'Online' };
      }
      return u;
    }));
  };

  const handleActionChat = (chatId, currentStatus) => {
    setChats(prev => prev.map(c => {
      if (c.id === chatId) {
        return { ...c, status: currentStatus === 'Active' ? 'Locked' : 'Active' };
      }
      return c;
    }));
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out of Admin Panel?')) {
      logout();
      navigate('/login');
    }
  };

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: RiDashboardLine },
    { id: 'users', label: 'Users', icon: RiUserSettingsLine },
    { id: 'chats', label: 'Chats', icon: RiChatSettingsLine },
    { id: 'media', label: 'Media', icon: RiImageLine },
    { id: 'settings', label: 'Settings', icon: RiSettingsLine }
  ];

  const adminStats = [
    { label: 'Total Users', value: stats.totalUsers, trend: 'Registered users', color: '#6C5CE7' },
    { label: 'Online Users', value: stats.onlineUsers, trend: 'Currently active', color: '#10B981' },
    { label: 'Total Messages', value: stats.totalMessages, trend: 'All messages', color: '#3B82F6' },
    { label: 'Active Rooms', value: stats.totalChats, trend: 'Chat rooms', color: '#EF4444' }
  ];

  return (
    <div className="admin-layout animate-fade">
      {/* Admin Dedicated Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <RiRadioButtonLine size={28} className="admin-logo-icon" />
          <span className="admin-logo-text">FRANXX ADMIN</span>
        </div>

        <nav className="admin-sidebar-nav">
          {sidebarItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`admin-nav-item ${activeMenu === item.id ? 'active' : ''}`}
                onClick={() => setActiveMenu(item.id)}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          {/* <button className="admin-nav-item back-app" onClick={() => navigate('/dashboard')}>
            <RiArrowLeftLine size={20} />
            <span>Back to App</span>
          </button> */}
          <button className="admin-nav-item logout-btn" onClick={handleLogout}>
            <RiLogoutBoxRLine size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Admin Content Area */}
      <main className="admin-main">
        <header className="admin-content-header">
          <div className="admin-header-title">
            <h2>{sidebarItems.find(i => i.id === activeMenu)?.label} Panel</h2>
            <p>FRANXX Administration Console</p>
          </div>
        </header>

        {loading ? (
          <div style={{ padding: '40px', color: 'var(--text-secondary)' }}>Loading data...</div>
        ) : (
          <>
            {/* ============ DASHBOARD ============ */}
            {activeMenu === 'dashboard' && (
              <div className="admin-scrollable-content">
                {/* Statistics Cards */}
                <div className="admin-stats-grid">
                  {adminStats.map((stat, idx) => (
                    <div key={idx} className="admin-stat-card" style={{ borderTop: `4px solid ${stat.color}` }}>
                      <span className="admin-stat-label">{stat.label}</span>
                      <div className="admin-stat-row">
                        <span className="admin-stat-value">{stat.value}</span>
                        <span className="admin-stat-trend" style={{ color: stat.color }}>{stat.trend}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick Tables View */}
                <div className="admin-tables-split">
                  {/* Recent Users */}
                  <div className="admin-card-table-wrapper">
                    <div className="admin-card-table-header">
                      <h3>Recent Users</h3>
                      <Button variant="outline" size="sm" onClick={() => setActiveMenu('users')}>View All</Button>
                    </div>
                    <div className="admin-table-container">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>User</th>
                            <th>Role</th>
                            <th>Joined</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.slice(0, 5).map(user => (
                            <tr key={user.id}>
                              <td>
                                <div className="admin-table-user-cell">
                                  <img src={user.avatar} alt={user.name} />
                                  <div>
                                    <span className="bold">{user.name}</span>
                                    <span className="sub">{user.username}</span>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span className={`admin-role-badge ${user.role.toLowerCase()}`}>{user.role}</span>
                              </td>
                              <td>{user.joined}</td>
                              <td>
                                <span className={`admin-status-badge ${user.status.toLowerCase()}`}>{user.status}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Recent Chats */}
                  <div className="admin-card-table-wrapper">
                    <div className="admin-card-table-header">
                      <h3>Recent Chats</h3>
                      <Button variant="outline" size="sm" onClick={() => setActiveMenu('chats')}>View All</Button>
                    </div>
                    <div className="admin-table-container">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Chat</th>
                            <th>Type</th>
                            <th>Messages</th>
                            <th>Last Active</th>
                          </tr>
                        </thead>
                        <tbody>
                          {chats.slice(0, 5).map(chat => (
                            <tr key={chat.id}>
                              <td className="bold">{chat.name}</td>
                              <td>
                                <span className={`admin-role-badge ${chat.type.toLowerCase()}`}>{chat.type}</span>
                              </td>
                              <td>{chat.messageCount.toLocaleString()}</td>
                              <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{chat.lastActive}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ============ USERS ============ */}
            {activeMenu === 'users' && (
              <div className="admin-scrollable-content">
                <div className="admin-card-table-wrapper full-width">
                  <div className="admin-card-table-header">
                    <h3>All Users ({users.length})</h3>
                  </div>
                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Joined</th>
                          <th>Followers</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map(user => (
                          <tr key={user.id}>
                            <td>
                              <div className="admin-table-user-cell">
                                <img src={user.avatar} alt={user.name} />
                                <div>
                                  <span className="bold">{user.name}</span>
                                  <span className="sub">{user.username}</span>
                                </div>
                              </div>
                            </td>
                            <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{user.email}</td>
                            <td>
                              <span className={`admin-role-badge ${user.role.toLowerCase()}`}>{user.role}</span>
                            </td>
                            <td>{user.joined}</td>
                            <td>{user.followers}</td>
                            <td>
                              <span className={`admin-status-badge ${user.status.toLowerCase()}`}>{user.status}</span>
                            </td>
                            <td>
                              <Button
                                variant={user.status === 'Online' ? 'outline' : 'primary'}
                                onClick={() => handleActionUser(user.id, user.status)}
                                className="admin-action-btn"
                              >
                                {user.status === 'Online'
                                  ? <><RiUserUnfollowLine size={16} /> Set Offline</>
                                  : <><RiUserFollowLine size={16} /> Set Online</>
                                }
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ============ CHATS ============ */}
            {activeMenu === 'chats' && (
              <div className="admin-scrollable-content">
                <div className="admin-card-table-wrapper full-width">
                  <div className="admin-card-table-header">
                    <h3>All Chat Rooms ({chats.length})</h3>
                  </div>
                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Chat Name</th>
                          <th>Type</th>
                          <th>Members</th>
                          <th>Messages</th>
                          <th>Created</th>
                          <th>Last Active</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {chats.map(chat => (
                          <tr key={chat.id}>
                            <td className="bold">{chat.name}</td>
                            <td>
                              <span className={`admin-role-badge ${chat.type.toLowerCase()}`}>{chat.type}</span>
                            </td>
                            <td>{chat.members}</td>
                            <td>{chat.messageCount.toLocaleString()}</td>
                            <td>{chat.createdAt}</td>
                            <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{chat.lastActive}</td>
                            <td>
                              <span className={`admin-status-badge ${chat.status.toLowerCase()}`}>{chat.status}</span>
                            </td>
                            <td>
                              <Button
                                variant="secondary"
                                onClick={() => handleActionChat(chat.id, chat.status)}
                                className="admin-action-btn"
                              >
                                {chat.status === 'Active' ? 'Lock' : 'Unlock'}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ============ MEDIA ============ */}
            {activeMenu === 'media' && (
              <div className="admin-scrollable-content">
                <div className="admin-card-table-wrapper full-width" style={{ textAlign: 'center', padding: '60px 40px' }}>
                  <RiImageLine size={48} color="var(--primary)" style={{ marginBottom: '16px', opacity: 0.8 }} />
                  <h3>Media Storage</h3>
                  <p style={{ color: 'var(--text-secondary)', marginTop: '8px', maxWidth: '400px', marginInline: 'auto', fontSize: '14px' }}>
                    Media management features coming soon.
                  </p>
                </div>
              </div>
            )}

            {/* ============ SETTINGS ============ */}
            {activeMenu === 'settings' && (
              <div className="admin-scrollable-content">
                <div className="admin-card-table-wrapper full-width" style={{ textAlign: 'center', padding: '60px 40px' }}>
                  <RiSettingsLine size={48} color="var(--primary)" style={{ marginBottom: '16px', opacity: 0.8 }} />
                  <h3>Admin Settings</h3>
                  <p style={{ color: 'var(--text-secondary)', marginTop: '8px', maxWidth: '400px', marginInline: 'auto', fontSize: '14px' }}>
                    System configuration features coming soon.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default AdminPage;
