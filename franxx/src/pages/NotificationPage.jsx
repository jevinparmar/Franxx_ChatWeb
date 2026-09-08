import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { getNotifications, acceptFollowRequest, declineFollowRequest, markNotificationsRead, acceptGroupAddRequest, declineGroupAddRequest } from '../services/userService';
import BackButton from '../components/common/BackButton';
import UserAvatar from '../components/common/UserAvatar';
import Button from '../components/common/Button';
import { RiCheckLine, RiDeleteBinLine } from 'react-icons/ri';
import axios from '../services/axios';

const NotificationPage = () => {
  const { user } = useAuth();
  const { socket, setUnreadNotificationCount } = useSocket();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState(null);

  const fetchNotifications = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data || []);
      try {
        await markNotificationsRead();
        setUnreadNotificationCount(0);
      } catch (markErr) {
        console.warn('Could not mark notifications read:', markErr);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  // Listen to real-time incoming notifications
  useEffect(() => {
    if (!socket) return;

    const handleNewNotif = (notif) => {
      setNotifications(prev => [notif, ...prev]);
      markNotificationsRead().catch(() => {});
      setUnreadNotificationCount(0);
    };

    socket.on('notification_received', handleNewNotif);
    return () => {
      socket.off('notification_received', handleNewNotif);
    };
  }, [socket, setUnreadNotificationCount]);

  const handleAccept = async (senderId, notificationId) => {
    setActioningId(notificationId);
    try {
      await acceptFollowRequest(senderId);
      setNotifications(prev => 
        prev.map(n => n._id === notificationId ? { ...n, type: 'follow_accept_done' } : n)
      );
    } catch (err) {
      console.error('Failed to accept request:', err);
    } finally {
      setActioningId(null);
    }
  };

  const handleDecline = async (senderId, notificationId) => {
    setActioningId(notificationId);
    try {
      await declineFollowRequest(senderId);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
    } catch (err) {
      console.error('Failed to decline request:', err);
    } finally {
      setActioningId(null);
    }
  };

  const handleAcceptGroup = async (notificationId) => {
    setActioningId(notificationId);
    try {
      await acceptGroupAddRequest(notificationId);
      setNotifications(prev =>
        prev.map(n => n._id === notificationId ? { ...n, type: 'follow_accept_done', message: 'approved addition request.' } : n)
      );
    } catch (err) {
      console.error('Failed to accept group add request:', err);
    } finally {
      setActioningId(null);
    }
  };

  const handleDeclineGroup = async (notificationId) => {
    setActioningId(notificationId);
    try {
      await declineGroupAddRequest(notificationId);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
    } catch (err) {
      console.error('Failed to decline group add request:', err);
    } finally {
      setActioningId(null);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await axios.delete(`/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 16px', minHeight: '100%', backgroundColor: 'var(--bg-main)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <BackButton label="Back" />
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Notifications</h2>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '40px' }}>🔔</div>
          <h4 style={{ color: 'var(--text-primary)', margin: 0 }}>You're all caught up</h4>
          <p style={{ fontSize: '13px', margin: 0, maxWidth: '240px', lineHeight: '1.4' }}>No new notifications at the moment.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {notifications.map((notification) => (
            <div 
              key={notification._id}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                padding: '16px', 
                borderRadius: '12px', 
                backgroundColor: 'var(--bg-card, #fff)', 
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              {/* Sender Avatar */}
              <div onClick={() => notification.sender?._id && navigate(`/user/${notification.sender._id}`)} style={{ cursor: 'pointer' }}>
                <UserAvatar
                  src={notification.sender?.avatar}
                  name={notification.sender?.name || 'User'}
                  size="md"
                />
              </div>

              {/* Text info */}
              <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: '500' }}>
                  <strong 
                    style={{ cursor: 'pointer', fontWeight: '600' }} 
                    onClick={() => notification.sender?._id && navigate(`/user/${notification.sender._id}`)}
                  >
                    {notification.sender?.name || 'Someone'}
                  </strong>{' '}
                  {notification.message || (
                    notification.type === 'friend_request' || notification.type === 'follow_request'
                      ? 'sent you a follow request.'
                      : notification.type === 'follow_accept' || notification.type === 'request_accepted'
                      ? 'accepted your follow request.'
                      : notification.type === 'follow_accept_done'
                      ? 'is now connected with you.'
                      : 'sent you a notification.'
                  )}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {new Date(notification.createdAt).toLocaleDateString()} at {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

               {/* Action buttons */}
              {(notification.type === 'follow_request' || notification.type === 'friend_request') && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button 
                    size="small" 
                    onClick={() => handleAccept(notification.sender?._id, notification._id)}
                    disabled={actioningId !== null}
                  >
                    Accept
                  </Button>
                  <Button 
                    size="small" 
                    variant="secondary"
                    onClick={() => handleDecline(notification.sender?._id, notification._id)}
                    disabled={actioningId !== null}
                  >
                    Reject
                  </Button>
                </div>
              )}

              {notification.type === 'group_add_request' && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button 
                    size="small" 
                    onClick={() => handleAcceptGroup(notification._id)}
                    disabled={actioningId !== null}
                  >
                    Approve
                  </Button>
                  <Button 
                    size="small" 
                    variant="secondary"
                    onClick={() => handleDeclineGroup(notification._id)}
                    disabled={actioningId !== null}
                  >
                    Decline
                  </Button>
                </div>
              )}

              {/* Accepted state */}
              {notification.type === 'follow_accept_done' && (
                <span style={{ fontSize: '12px', color: 'var(--success-green, #10b981)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                  <RiCheckLine size={16} /> Accepted
                </span>
              )}

              {/* Delete single notification button */}
              <button
                type="button"
                onClick={() => handleDeleteNotification(notification._id)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
                title="Delete notification"
              >
                <RiDeleteBinLine size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationPage;
