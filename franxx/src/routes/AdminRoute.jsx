import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';

const AdminRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loader fullscreen={true} brandName="FRANXX" />;
  }

  return user && user.role === 'admin' ? (
    <Outlet />
  ) : (
    <Navigate to="/login/admin" replace />
  );
};

export default AdminRoute;
