import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { RiUserLine, RiLockLine, RiMailLine, RiRadioButtonLine } from 'react-icons/ri';
import './AuthPages.css';

const SignupPage = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signup(
        formData.fullName,
        formData.username,
        formData.email,
        formData.password
      );
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="auth-card animate-fade">
      <div className="auth-card-logo">
        <RiRadioButtonLine size={40} color="var(--primary)" />
        <span className="auth-logo-text">FRANXX</span>
      </div>

      <h2 className="auth-title">Create Account</h2>
      <p className="auth-subtitle">Join the squad and synchronize your device</p>

      {error && <div className="input-error" style={{ marginBottom: '16px', textAlign: 'center' }}>{error}</div>}

      <form className="auth-form" onSubmit={handleSubmit}>
        <Input
          label="Full Name"
          name="fullName"
          id="fullName"
          value={formData.fullName}
          onChange={handleChange}
          placeholder="Enter full name"
          icon={RiUserLine}
          required
        />

        <Input
          label="Username"
          name="username"
          id="username"
          value={formData.username}
          onChange={handleChange}
          placeholder="e.g. @zerotwo"
          icon={RiUserLine}
          required
        />

        <Input
          label="Email Address"
          type="email"
          name="email"
          id="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="e.g. name@franxx.io"
          icon={RiMailLine}
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

        <Button
          type="submit"
          loading={loading}
          className="auth-btn-submit"
        >
          Sign Up
        </Button>
      </form>


      <div className="auth-footer">
        Already have an account? <Link to="/login">Login</Link>
      </div>
    </div>
  );
};

export default SignupPage;
