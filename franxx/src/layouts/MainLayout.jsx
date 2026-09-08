import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/layout/Sidebar';
import Loader from '../components/common/Loader';
import './layouts.css';

const MainLayout = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Loading state
  if (loading) {
    return <Loader fullscreen text="Loading FRANXX shell..." />;
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Determine if we should show the right panel content directly on mobile.
  // Mobile right panel triggers when viewing details like user profiles, media files, settings details, or an active chat.
  const isRightActive = 
    location.pathname.startsWith('/user/') ||
    location.pathname === '/profile' ||
    location.pathname === '/media/files' ||
    (location.pathname === '/dashboard' && new URLSearchParams(location.search).has('chat')) ||
    (location.pathname === '/settings' && location.search.includes('tab='));

  return (
    <div className={`main-layout ${isRightActive ? 'right-active' : ''}`}>
      <div className="layout-sidebar">
        <Sidebar />
      </div>
      <div className="layout-content-wrapper">
        <Outlet />
      </div>
    </div>
  );
};

export default MainLayout;
