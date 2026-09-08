import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { RiChat3Line, RiSearch2Line, RiPlayList2Line, RiImage2Line, RiSettings4Line, RiShieldUserLine, RiNotification3Line } from 'react-icons/ri';
import './Sidebar.css';

const Sidebar = () => {
  const { user } = useAuth();
  const { unreadNotificationCount } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { icon: RiChat3Line, path: '/dashboard', label: 'Chats' },
    { icon: RiSearch2Line, path: '/search', label: 'Search' },
    { icon: RiNotification3Line, path: '/notifications', label: 'Notifications', badge: true },
    { icon: RiPlayList2Line, path: '/status', label: 'Status' },
    { icon: RiImage2Line, path: '/media', label: 'Media' },
    { icon: RiSettings4Line, path: '/settings', label: 'Settings' }
  ];

  return (
    <div className="sidebar-container animate-fade">
      <div className="sidebar-top">
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.path === '/dashboard' 
              ? location.pathname === '/dashboard' 
              : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`sidebar-nav-item ${isActive ? 'active' : ''} ${item.path === '/settings' ? 'nav-settings' : ''}`}
                title={item.label}
              >
                <Icon size={22} />
                {item.badge && unreadNotificationCount > 0 && (
                  <span className="sidebar-badge-count">
                    {unreadNotificationCount}
                  </span>
                )}
                <span className="sidebar-tooltip">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="sidebar-bottom">
        {/* Only render Admin Panel button if authenticated user is admin */}
        {user?.role === 'admin' && (
          <div 
            className={`sidebar-nav-item sidebar-admin-btn ${location.pathname === '/admin' ? 'active' : ''}`}
            onClick={() => navigate('/admin')}
            title="Admin Panel"
          >
            <RiShieldUserLine size={22} />
            <span className="sidebar-tooltip">Admin Panel</span>
          </div>
        )}

        {user && (
          <div 
            className={`sidebar-user-avatar ${location.pathname === '/profile' ? 'active' : ''}`}
            onClick={() => navigate('/profile')}
            title="My Profile"
          >
            <img src={user.avatar} alt={user.name} onError={(e) => { e.target.style.display = 'none'; }} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
