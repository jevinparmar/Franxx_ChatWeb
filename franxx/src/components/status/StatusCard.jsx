import UserAvatar from '../common/UserAvatar';
import { RiMoreFill } from 'react-icons/ri';
import './status.css';

const StatusCard = ({ status, onClick, onMenuClick }) => {
  return (
    <div className="status-card-item animate-fade" onClick={onClick}>
      <div className={`status-avatar-ring ${status.unread ? 'unread' : 'read'}`}>
        <UserAvatar
          src={status.avatar}
          name={status.name}
          size="md"
        />
      </div>

      <div className="status-item-info">
        <h4 className="status-item-name">{status.name}</h4>
        <span className="status-item-time">{status.time}</span>
      </div>

      <button 
        className="status-item-action" 
        onClick={(e) => {
          e.stopPropagation();
          if (onMenuClick) onMenuClick(status);
        }}
        aria-label="Status actions"
      >
        <RiMoreFill size={18} />
      </button>
    </div>
  );
};

export default StatusCard;
