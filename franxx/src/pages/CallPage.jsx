import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';

const CallPage = () => {
  const navigate = useNavigate();
  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h2>Call Interface</h2>
      <p style={{ color: 'var(--text-secondary)', margin: '16px 0' }}>Simulating secure squad audio/video streams...</p>
      <Button onClick={() => navigate('/dashboard')}>Back to Chat</Button>
    </div>
  );
};

export default CallPage;
