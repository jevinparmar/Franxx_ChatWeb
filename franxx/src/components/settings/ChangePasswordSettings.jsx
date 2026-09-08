import { useState } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';
import api from '../../services/axios';
import { RiLockPasswordLine, RiLockLine } from 'react-icons/ri';

const ChangePasswordSettings = () => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      setError('Please fill in all password fields');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.put('/users/change-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      setSuccess(data.message || 'Password changed successfully');
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password. Please check your current password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-section-card animate-fade">
      <h3 className="settings-section-title">
        <RiLockPasswordLine size={18} color="var(--accent-color)" /> Change Password
      </h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
        Protect your pilot session. Configure a strong password that you do not reuse elsewhere.
      </p>

      {error && <div className="input-error" style={{ marginBottom: '16px', textAlign: 'center' }}>{error}</div>}
      {success && (
        <div style={{ 
          padding: '10px 12px', 
          borderRadius: 'var(--radius-sm)', 
          background: 'rgba(16, 185, 129, 0.15)', 
          border: '1px solid #10b981', 
          color: '#10b981',
          fontSize: '13px',
          textAlign: 'center',
          marginBottom: '16px'
        }}>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="edit-profile-form" style={{ maxWidth: '400px' }}>
        <Input
          label="Current Password"
          type="password"
          name="currentPassword"
          value={formData.currentPassword}
          onChange={handleChange}
          placeholder="••••••••"
          icon={RiLockLine}
          required
          disabled={loading}
        />

        <Input
          label="New Password"
          type="password"
          name="newPassword"
          value={formData.newPassword}
          onChange={handleChange}
          placeholder="••••••••"
          icon={RiLockLine}
          required
          disabled={loading}
        />

        <Input
          label="Confirm New Password"
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="••••••••"
          icon={RiLockLine}
          required
          disabled={loading}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
          <Button type="submit" loading={loading}>
            Update Password
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChangePasswordSettings;
