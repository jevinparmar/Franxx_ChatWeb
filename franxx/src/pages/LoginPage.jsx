import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { forgotPassword, resetPassword } from '../services/authService';
import { RiUserLine, RiLockLine, RiRadioButtonLine, RiShieldUserLine, RiKeyLine } from 'react-icons/ri';
import './AuthPages.css';

const LoginPage = ({ isAdmin = false }) => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ emailOrUsername: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot Password Modal states
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState(1); // 1 = Enter Email, 2 = Enter OTP & Password
  const [forgotOTP, setForgotOTP] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(formData.emailOrUsername, formData.password);
      
      if (isAdmin) {
        if (result && result.role === 'admin') {
          navigate('/admin');
        } else {
          setError('Access denied. Administrator privileges required.');
        }
      } else {
        if (result && result.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to sign in. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');
    setForgotLoading(true);

    try {
      if (forgotStep === 1) {
        await forgotPassword(forgotEmail);
        setForgotStep(2);
        setForgotOTP('');
        setForgotNewPassword('');
        setForgotConfirmPassword('');
        setForgotSuccess('A password reset code has been logged to the server console.');
      } else {
        if (forgotNewPassword !== forgotConfirmPassword) {
          throw new Error('Passwords do not match');
        }
        await resetPassword(forgotEmail, forgotOTP, forgotNewPassword);
        setForgotSuccess('Password reset successfully. Redirecting to login...');
        setTimeout(() => {
          setShowForgotModal(false);
          setForgotStep(1);
          setForgotEmail('');
        }, 2000);
      }
    } catch (err) {
      setForgotError(err.response?.data?.message || err.message || 'Action failed.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="auth-card animate-fade">
      <div className="auth-card-logo">
        {isAdmin ? (
          <RiShieldUserLine size={40} color="var(--primary)" />
        ) : (
          <RiRadioButtonLine size={40} color="var(--primary)" />
        )}
        <span className="auth-logo-text">{isAdmin ? 'FRANXX ADMIN' : 'FRANXX'}</span>
      </div>

      <h2 className="auth-title">{isAdmin ? 'Admin Portal' : 'Welcome Back'}</h2>
      <p className="auth-subtitle">
        {isAdmin ? 'Sign in to access system administration console' : 'Login to synchronize with your squad'}
      </p>

      {error && <div className="input-error" style={{ marginBottom: '16px', textAlign: 'center' }}>{error}</div>}

      <form className="auth-form" onSubmit={handleSubmit}>
        <Input
          label={isAdmin ? "Admin Email or Username" : "Email or Username"}
          name="emailOrUsername"
          id="emailOrUsername"
          value={formData.emailOrUsername}
          onChange={handleChange}
          placeholder="Enter email or username"
          icon={RiUserLine}
          required
        />

        <Input
          label="Password"
          type="password"
          name="password"
          id="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="••••••••"
          icon={RiLockLine}
          required
        />

        {!isAdmin && (
          <div className="auth-forgot-container">
            <Link
              to="#"
              className="auth-forgot-password"
              onClick={(e) => {
                e.preventDefault();
                setForgotStep(1);
                setForgotEmail('');
                setForgotError('');
                setForgotSuccess('');
                setShowForgotModal(true);
              }}
            >
              Forgot Password?
            </Link>
          </div>
        )}

        <Button
          type="submit"
          loading={loading}
          className="auth-btn-submit"
        >
          {isAdmin ? 'Login as Admin' : 'Login'}
        </Button>
      </form>

      {!isAdmin && (
        <div className="auth-footer" style={{ marginTop: '16px' }}>
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </div>
      )}

      {isAdmin && (
        <div className="auth-footer" style={{ marginTop: '16px' }}>
          Standard Pilot? <Link to="/login">User Login</Link>
        </div>
      )}

      {/* FORGOT PASSWORD MODAL */}
      <Modal
        isOpen={showForgotModal}
        onClose={() => !forgotLoading && setShowForgotModal(false)}
        title="Reset Password"
      >
        <form onSubmit={handleForgotSubmit} className="edit-profile-form">
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {forgotStep === 1 
                ? 'Enter your registered email to receive a password reset verification code.'
                : `Enter the code sent to ${forgotEmail} and configure your new password.`}
            </span>
          </div>

          {forgotSuccess && (
            <div style={{ 
              padding: '10px 12px', 
              borderRadius: 'var(--radius-sm)', 
              background: 'rgba(16, 185, 129, 0.15)', 
              border: '1px solid #10b981', 
              color: '#10b981',
              fontSize: '12px',
              textAlign: 'center',
              marginBottom: '14px'
            }}>
              {forgotSuccess}
            </div>
          )}

          {forgotError && <div className="input-error" style={{ textAlign: 'center', marginBottom: '12px' }}>{forgotError}</div>}

          {forgotStep === 1 ? (
            <Input
              label="Email Address"
              type="email"
              name="forgotEmail"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              placeholder="pilot@franxx.io"
              icon={RiUserLine}
              required
              disabled={forgotLoading}
            />
          ) : (
            <>
              <Input
                label="Reset Code (OTP)"
                name="forgotOTP"
                value={forgotOTP}
                onChange={(e) => setForgotOTP(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit code"
                icon={RiKeyLine}
                required
                maxLength={6}
                disabled={forgotLoading}
              />
              <Input
                label="New Password"
                type="password"
                name="forgotNewPassword"
                value={forgotNewPassword}
                onChange={(e) => setForgotNewPassword(e.target.value)}
                placeholder="Enter new password"
                icon={RiLockLine}
                required
                disabled={forgotLoading}
              />
              <Input
                label="Confirm New Password"
                type="password"
                name="forgotConfirmPassword"
                value={forgotConfirmPassword}
                onChange={(e) => setForgotConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                icon={RiLockLine}
                required
                disabled={forgotLoading}
              />
            </>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
            <Button
              variant="secondary"
              disabled={forgotLoading}
              type="button"
              onClick={() => {
                if (forgotStep === 2) {
                  setForgotStep(1);
                } else {
                  setShowForgotModal(false);
                }
              }}
            >
              {forgotStep === 2 ? 'Back' : 'Cancel'}
            </Button>
            <Button type="submit" loading={forgotLoading}>
              {forgotStep === 1 ? 'Send Code' : 'Reset Password'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LoginPage;
