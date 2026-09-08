import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { getNotifications } from '../services/userService';
import '../components/common/toast.css';

const SocketContext = createContext();

const SOCKET_ENDPOINT = import.meta.env.VITE_SOCKET_ENDPOINT || 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((toast) => {
    setToasts(prev => [...prev, { ...toast, id: toast.id || Date.now().toString() }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        if (document.title.startsWith('🟢 ')) {
          document.title = document.title.replace('🟢 ', '');
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      setIsConnected(false);
      return;
    }

    // Pass JWT token in auth handshake
    const authToken = token || localStorage.getItem('franxx-token') || user?.token;
    const newSocket = io(SOCKET_ENDPOINT, {
      auth: {
        token: authToken,
      },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    setSocket(newSocket);

    // Fetch initial unread notifications count
    const fetchUnreadNotificationsCount = async () => {
      try {
        const notifs = await getNotifications();
        const unread = notifs.filter(n => !n.read).length;
        setUnreadNotificationCount(unread);
      } catch (err) {
        console.warn('Could not fetch notifications unread count:', err);
      }
    };
    fetchUnreadNotificationsCount();

    // Register user session
    newSocket.emit('setup', user);
    newSocket.emit('register-user', user._id || user.id);

    newSocket.on('connected', () => {
      setIsConnected(true);
    });

    newSocket.on('get_online_users', (usersList) => {
      setOnlineUsers(usersList);
    });

    newSocket.on('user_online', (data) => {
      if (data && data.onlineUsers) setOnlineUsers(data.onlineUsers);
    });

    newSocket.on('user_offline', (data) => {
      if (data && data.onlineUsers) setOnlineUsers(data.onlineUsers);
    });

    const showGreenDotInTab = () => {
      if (document.hidden) {
        if (!document.title.startsWith('🟢 ')) {
          document.title = `🟢 ${document.title}`;
        }
      }
    };

    const handleMessageReceived = (newMessage) => {
      const senderId = (newMessage.sender?._id || newMessage.sender)?.toString();
      if (senderId === user?._id?.toString() || senderId === user?.id?.toString()) return;

      const queryParams = new URLSearchParams(window.location.search);
      const activeChatId = queryParams.get('chat');
      const isDashboard = window.location.pathname === '/dashboard';
      const chatId = (newMessage.chat?._id || newMessage.chat || newMessage.chatId).toString();

      if (isDashboard && activeChatId === chatId) {
        return;
      }

      showGreenDotInTab();

      const isGroup = newMessage.chat?.type === 'group' || newMessage.chatType === 'group';
      const title = isGroup 
        ? `${newMessage.chat?.name || 'Group Chat'}` 
        : `${newMessage.sender?.name || 'New Message'}`;
      const messageText = isGroup 
        ? `${newMessage.sender?.name}: ${newMessage.text || 'Sent an attachment'}`
        : (newMessage.text || 'Sent an attachment');

      showToast({
        title,
        message: messageText,
        avatar: isGroup ? newMessage.chat?.avatar : newMessage.sender?.avatar,
        type: isGroup ? 'group' : 'message',
        onClick: () => {
          navigate(`/dashboard?chat=${chatId}`);
        }
      });
    };

    const handleNotificationReceived = (notif) => {
      setUnreadNotificationCount(prev => prev + 1);
      showGreenDotInTab();

      if (notif && notif.sender?._id !== user?._id) {
        showToast({
          title: notif.sender?.name || 'Notification',
          message: notif.message || 'sent you a request.',
          avatar: notif.sender?.avatar,
          type: 'notification',
          onClick: () => {
            navigate('/notifications');
          }
        });
      }
    };

    const handleAddedToGroup = (data) => {
      showGreenDotInTab();
      if (data) {
        showToast({
          title: 'Added to Group',
          message: `${data.creatorName} added you to "${data.name}"`,
          avatar: data.avatar,
          type: 'group',
          onClick: () => {
            navigate(`/dashboard?chat=${data.chatId}`);
          }
        });
      }
    };

    newSocket.on('message received', handleMessageReceived);
    newSocket.on('notification_received', handleNotificationReceived);
    newSocket.on('added_to_group', handleAddedToGroup);

    return () => {
      newSocket.off('connected');
      newSocket.off('get_online_users');
      newSocket.off('user_online');
      newSocket.off('user_offline');
      newSocket.off('message received', handleMessageReceived);
      newSocket.off('notification_received', handleNotificationReceived);
      newSocket.off('added_to_group', handleAddedToGroup);
      newSocket.disconnect();
    };
  }, [user, token, navigate, showToast]);

  return (
    <SocketContext.Provider value={{ 
      socket, 
      isConnected, 
      onlineUsers,
      unreadNotificationCount,
      setUnreadNotificationCount,
      showToast
    }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="toast-notification-stack">
      {toasts.map(toast => (
        <InAppToast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

const InAppToast = ({ toast, onClose }) => {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const autoDismiss = setTimeout(() => {
      handleClose();
    }, 4500);

    return () => clearTimeout(autoDismiss);
  }, []);

  const handleClose = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleClick = (e) => {
    if (e.target.closest('.inapp-toast-close')) return;
    if (toast.onClick) toast.onClick();
    handleClose();
  };

  const getToastClass = () => {
    if (toast.type === 'notification') return 'inapp-toast-card toast-notification';
    if (toast.type === 'group') return 'inapp-toast-card toast-group';
    return 'inapp-toast-card';
  };

  return (
    <div className={`${getToastClass()} ${isFadingOut ? 'toast-fade-out' : ''}`} onClick={handleClick}>
      <div className="inapp-toast-avatar-wrapper">
        <img 
          src={toast.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'} 
          alt={toast.title} 
          className="inapp-toast-avatar"
          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'; }}
        />
        {toast.type === 'group' && <span className="inapp-toast-badge">👥</span>}
        {toast.type === 'notification' && <span className="inapp-toast-badge success">🔔</span>}
      </div>
      <div className="inapp-toast-content">
        <h5 className="inapp-toast-title">{toast.title}</h5>
        <p className="inapp-toast-message">{toast.message}</p>
      </div>
      <button type="button" className="inapp-toast-close" onClick={handleClose}>
        &times;
      </button>
    </div>
  );
};
