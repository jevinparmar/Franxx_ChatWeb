import { useAuth } from '../context/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';
import './layouts.css';

// Pre-calculate random styles for background particles at module initialization to comply with React 19 render purity rules
const STATIC_PARTICLES = Array.from({ length: 12 }, () => ({
  left: `${Math.random() * 90 + 5}%`,
  top: `${Math.random() * 90 + 5}%`,
  animationDelay: `${Math.random() * 5}s`,
  animationDuration: `${Math.random() * 8 + 6}s`
}));

const AuthLayout = () => {
  const { user, loading } = useAuth();

  // If already authenticated, redirect to dashboard
  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="auth-layout">
      {/* Animated Background Elements */}
      <div className="auth-bg-shapes">
        <div className="floating-shape circle-1"></div>
        <div className="floating-shape circle-2"></div>
        <div className="floating-shape box-1"></div>
        <div className="floating-shape box-2"></div>
        <div className="floating-shape card-1"></div>
        <div className="floating-shape card-2"></div>
        <div className="floating-shape sphere-1"></div>
        {STATIC_PARTICLES.map((particle, i) => (
          <span 
            key={i} 
            className={`floating-particle particle-${i + 1}`}
            style={{
              left: particle.left,
              top: particle.top,
              animationDelay: particle.animationDelay,
              animationDuration: particle.animationDuration
            }}
          ></span>
        ))}
      </div>

      <div className="auth-card-container">
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
