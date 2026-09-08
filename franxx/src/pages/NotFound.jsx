import { useNavigate } from 'react-router-dom';
import { RiAlertLine } from 'react-icons/ri';
import Button from '../components/common/Button';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-main)',
      color: 'var(--text-primary)',
      padding: '20px',
      textAlign: 'center'
    }}>
      <RiAlertLine size={64} color="var(--accent-color)" style={{ marginBottom: '20px' }} />
      <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>404 - Plantation Lost</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '24px', maxWidth: '380px' }}>
        The co-piloting coordinates you requested do not exist or have been wiped from the APE server databases.
      </p>
      <Button onClick={() => navigate('/dashboard')}>
        Return to Dashboard
      </Button>
    </div>
  );
};

export default NotFound;
