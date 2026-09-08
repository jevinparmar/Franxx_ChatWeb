import { RiPhoneLine, RiVideoChatLine, RiMore2Fill } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import UserAvatar from "../common/UserAvatar";
import BackButton from "../common/BackButton";
import "./chat.css";

const ChatHeader = ({ chat, onBack, typingStatus, onOptionsClick }) => {
  const navigate = useNavigate();

  const handleProfileRedirect = () => {
    if (chat.type !== "group" && (chat.otherUserId || chat.id)) {
      navigate(`/user/${chat.otherUserId || chat.id}`);
    }
  };

  const isDeletedUser = chat.isDeletedUser || !chat.name || chat.name === 'Unknown User';
  const displayName = isDeletedUser ? 'Deleted User' : chat.name;

  return (
    <div className="active-chat-header">
      <div className="active-chat-header-left">
        <div className="back-button-mobile-wrapper">
          <BackButton onClick={onBack} label="" />
        </div>

        <div onClick={handleProfileRedirect} style={{ cursor: chat.type === "group" || isDeletedUser ? "default" : "pointer" }}>
          <UserAvatar
            src={chat.avatar}
            name={displayName}
            size="md"
            isDeleted={isDeletedUser}
            isOnline={chat.online || chat.status === 'Online'}
          />
        </div>

        <div
          className="active-chat-header-info"
          onClick={handleProfileRedirect}
          style={{ cursor: chat.type === "group" || isDeletedUser ? "default" : "pointer" }}
        >
          <h3 className="active-chat-header-name">{displayName}</h3>
          <span
            className={`active-chat-header-status ${(chat.online || typingStatus) ? "online" : ""}`}
          >
            {typingStatus ? (
              <span className="typing-indicator-text">{typingStatus}</span>
            ) : chat.type === "group" ? (
              `${chat.members?.length || chat.memberCount || 2} members`
            ) : isDeletedUser ? (
              "Unavailable"
            ) : chat.online || chat.status === 'Online' ? (
              "Online"
            ) : (
              chat.lastSeen ? `last seen ${new Date(chat.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : "Offline"
            )}
          </span>
        </div>
      </div>

      <div className="active-chat-header-actions">
        <button className="active-chat-header-btn" title="Voice Call">
          <RiPhoneLine size={20} />
        </button>
        <button className="active-chat-header-btn" title="Video Call">
          <RiVideoChatLine size={20} />
        </button>
        <button className="active-chat-header-btn" title="More options" onClick={onOptionsClick}>
          <RiMore2Fill size={20} />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
