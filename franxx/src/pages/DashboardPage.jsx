import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { fetchChats, fetchMessages, sendMessage, createGroupChat } from '../services/chatService';
import { blockUser } from '../services/userService';
import ChatList from '../components/chat/ChatList';
import ChatHeader from '../components/chat/ChatHeader';
import MessageBubble from '../components/chat/MessageBubble';
import MessageInput from '../components/chat/MessageInput';
import GroupInfoModal from '../components/chat/GroupInfoModal';
import { normalizeMessage, mergeMessages } from '../utils/normalizeMessage';
import axios from '../services/axios';
import '../components/chat/chat.css';

const DashboardPage = () => {
  const { user } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const [rawChats, setRawChats] = useState(() => {
    try {
      const cached = localStorage.getItem(`rawChats_${user?._id || 'guest'}`);
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      return [];
    }
  });
  const [messagesMap, setMessagesMap] = useState(() => {
    try {
      const cached = localStorage.getItem(`messagesMap_${user?._id || 'guest'}`);
      return cached ? JSON.parse(cached) : {};
    } catch (e) {
      return {};
    }
  });
  const [loading, setLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState({}); // { [chatId]: 'Name is typing...' }
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);

  const handleChatUpdated = useCallback((updatedChat) => {
    if (!updatedChat) {
      // Clear active conversation if user left
      setIsGroupInfoOpen(false);
      navigate('/dashboard');
      return;
    }
    setRawChats(prev => {
      const nextChats = prev.map(c => c._id === updatedChat._id ? updatedChat : c);
      saveChatsToCache(nextChats);
      return nextChats;
    });
  }, [navigate]);

  // Cache persistence helpers
  const saveChatsToCache = (chatsData) => {
    if (user?._id) {
      try {
        localStorage.setItem(`rawChats_${user._id}`, JSON.stringify(chatsData));
      } catch (e) {
        console.error('Failed to save chats cache:', e);
      }
    }
  };

  const saveMessagesToCache = (newMap) => {
    if (user?._id) {
      try {
        localStorage.setItem(`messagesMap_${user._id}`, JSON.stringify(newMap));
      } catch (e) {
        console.error('Failed to save messages cache:', e);
      }
    }
  };

  // Load user-specific cache once authenticated
  useEffect(() => {
    if (user?._id) {
      try {
        const cachedChats = localStorage.getItem(`rawChats_${user._id}`);
        if (cachedChats) {
          setRawChats(JSON.parse(cachedChats));
        }
        const cachedMessages = localStorage.getItem(`messagesMap_${user._id}`);
        if (cachedMessages) {
          setMessagesMap(JSON.parse(cachedMessages));
        }
      } catch (e) {
        console.error('Failed to load cache:', e);
      }
    }
  }, [user?._id]);

  // Pagination & scroll preservation states
  const [hasMoreMap, setHasMoreMap] = useState({});
  const [loadingMore, setLoadingMore] = useState(false);

  const isScrollingToOldMessages = useRef(false);
  const shouldScrollToBottomRef = useRef(false);
  const lastChatId = useRef(null);

  const queryParams = new URLSearchParams(location.search);
  const activeChatId = queryParams.get('chat');

  const formatChat = useCallback((chat) => {
    if (!chat) return null;
    const currentUserIdStr = user?._id?.toString();

    const otherMember = chat.type === 'individual'
      ? chat.members?.find(m => (m._id || m).toString() !== currentUserIdStr)
      : null;

    const otherMemberObj = typeof otherMember === 'object' ? otherMember : null;
    const isOtherOnline = otherMemberObj ? (onlineUsers.includes(otherMemberObj._id?.toString()) || otherMemberObj.status === 'Online') : false;

    const messagesList = messagesMap[chat._id] || (chat.lastMessage ? [normalizeMessage(chat.lastMessage, user?._id)].filter(Boolean) : []);
    const isDeletedUser = chat.type === 'individual' && (!otherMemberObj || otherMemberObj.name === 'Unknown User');
    const chatIdStr = (chat._id || chat.id).toString();

    return {
      id: chatIdStr,
      _id: chatIdStr,
      name: chat.type === 'individual' ? (otherMemberObj ? otherMemberObj.name : 'User') : chat.name,
      avatar: chat.type === 'individual' ? (otherMemberObj ? otherMemberObj.avatar : '') : (chat.avatar || ''),
      online: isOtherOnline,
      status: isOtherOnline ? 'Online' : (otherMemberObj ? otherMemberObj.status || 'Offline' : 'Offline'),
      lastSeen: otherMemberObj ? otherMemberObj.lastSeen : null,
      otherUserId: otherMemberObj ? (otherMemberObj._id || otherMemberObj).toString() : null,
      isDeletedUser: isDeletedUser,
      type: chat.type,
      members: chat.members || [],
      groupAdmin: chat.groupAdmin,
      isMuted: chat.mutedBy?.some(id => (id._id || id).toString() === currentUserIdStr),
      isPinned: chat.pinnedBy?.some(id => (id._id || id).toString() === currentUserIdStr),
      unread: chat.unread || 0,
      messages: messagesList,
      lastMessage: chat.lastMessage
    };
  }, [user?._id, messagesMap, onlineUsers]);

  const sortChats = useCallback((chatList) => {
    const currentUserIdStr = user?._id?.toString();
    return [...chatList].sort((a, b) => {
      const aPinned = a.pinnedBy?.some(id => (id._id || id).toString() === currentUserIdStr);
      const bPinned = b.pinnedBy?.some(id => (id._id || id).toString() === currentUserIdStr);

      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;

      const aTime = a.lastMessage ? new Date(a.lastMessage.createdAt) : new Date(a.updatedAt || 0);
      const bTime = b.lastMessage ? new Date(b.lastMessage.createdAt) : new Date(b.updatedAt || 0);
      return bTime - aTime;
    });
  }, [user?._id]);

  const chats = sortChats(rawChats.map(formatChat).filter(Boolean));
  const activeChat = chats.find(c => c.id === activeChatId || c._id === activeChatId);

  const loadChats = async () => {
    try {
      const data = await fetchChats();
      setRawChats(prev => {
        let updated;
        if (location.state?.newChat && !data.some(c => c._id === location.state.newChat._id)) {
          updated = [location.state.newChat, ...data];
        } else {
          updated = data;
        }
        saveChatsToCache(updated);
        return updated;
      });
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  };

  useEffect(() => {
    if (user) {
      loadChats();
    }
  }, [user]);

  useEffect(() => {
    if (!activeChatId) return;

    if (location.state?.newChat && location.state.newChat._id === activeChatId) {
      setRawChats(prev => {
        if (prev.some(c => c._id === activeChatId)) return prev;
        const updated = [location.state.newChat, ...prev];
        saveChatsToCache(updated);
        return updated;
      });
    }
  }, [activeChatId, location.state]);

  // Load chat messages with normalization (optimized with caching)
  useEffect(() => {
    if (!activeChatId) return;

    if (socket) {
      socket.emit('join chat', activeChatId);
    }

    const loadMessages = async () => {
      const hasCached = messagesMap[activeChatId] && messagesMap[activeChatId].length > 0;
      if (!hasCached) {
        setLoading(true);
      }
      try {
        const data = await fetchMessages(activeChatId);
        const normalizedList = data.map(m => normalizeMessage(m, user?._id)).filter(Boolean);

        setMessagesMap(prev => {
          const nextMap = {
            ...prev,
            [activeChatId]: normalizedList
          };
          saveMessagesToCache(nextMap);
          return nextMap;
        });

        setHasMoreMap(prev => ({
          ...prev,
          [activeChatId]: data.length >= 50 // default limit is 50
        }));

        setRawChats(prev => {
          const updated = prev.map(c => c._id === activeChatId ? { ...c, unread: 0 } : c);
          saveChatsToCache(updated);
          return updated;
        });

        // Mark messages read in backend
        await axios.patch(`/messages/read/${activeChatId}`).catch(() => {});
        if (socket) {
          socket.emit('mark_read', { chatId: activeChatId, userId: user?._id });
        }
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [activeChatId, socket, user?._id]);

  // Real-time socket listeners for incoming messages & typing
  useEffect(() => {
    if (!socket) return;

    const handleMessageReceived = (newMessage) => {
      const chatId = (newMessage.chat?._id || newMessage.chat || newMessage.chatId).toString();
      const normalizedIncoming = normalizeMessage(newMessage, user?._id);

      setMessagesMap(prev => {
        const existing = prev[chatId] || [];
        const merged = mergeMessages(existing, normalizedIncoming, user?._id);
        const nextMap = {
          ...prev,
          [chatId]: merged
        };
        saveMessagesToCache(nextMap);
        return nextMap;
      });

      setRawChats(prev => {
        const chatExists = prev.some(c => c._id === chatId);
        if (!chatExists) {
          loadChats();
          return prev;
        }

        const updated = prev.map(c => {
          if (c._id === chatId) {
            return {
              ...c,
              lastMessage: newMessage,
              unread: chatId === activeChatId ? 0 : (c.unread || 0) + 1
            };
          }
          return c;
        });

        const sorted = updated.sort((a, b) => {
          const aTime = a.lastMessage ? new Date(a.lastMessage.createdAt) : new Date(a.updatedAt);
          const bTime = b.lastMessage ? new Date(b.lastMessage.createdAt) : new Date(b.updatedAt);
          return bTime - aTime;
        });
        saveChatsToCache(sorted);
        return sorted;
      });
    };

    const handleTyping = (data) => {
      const room = typeof data === 'string' ? data : data.room;
      const senderName = typeof data === 'object' && data.user ? data.user.name : 'Someone';
      setTypingUsers(prev => ({ ...prev, [room]: `${senderName} is typing...` }));
    };

    const handleStopTyping = (data) => {
      const room = typeof data === 'string' ? data : data.room;
      setTypingUsers(prev => {
        const copy = { ...prev };
        delete copy[room];
        return copy;
      });
    };

    const handleMessagesRead = (data) => {
      if (data && data.chatId) {
        setMessagesMap(prev => {
          const list = prev[data.chatId] || [];
          return {
            ...prev,
            [data.chatId]: list.map(m => ({ ...m, status: 'seen' }))
          };
        });
      }
    };

    const handleMessageDeletedForEveryone = ({ chatId, messageId }) => {
      const chatIdStr = chatId.toString();
      const messageIdStr = messageId.toString();

      setMessagesMap(prev => {
        const list = prev[chatIdStr] || [];
        const updatedList = list.map(m => (m.id === messageIdStr || m._id === messageIdStr) ? { ...m, text: 'This message was deleted', isDeletedForEveryone: true, mediaUrl: '', mediaType: 'none' } : m);
        const nextMap = {
          ...prev,
          [chatIdStr]: updatedList
        };
        saveMessagesToCache(nextMap);
        return nextMap;
      });

      setRawChats(chatsList => {
        const updatedChats = chatsList.map(c => {
          const cId = c._id.toString();
          if (cId === chatIdStr && c.lastMessage && (c.lastMessage._id === messageIdStr || c.lastMessage.id === messageIdStr)) {
            return {
              ...c,
              lastMessage: {
                ...c.lastMessage,
                text: 'This message was deleted',
                isDeletedForEveryone: true,
                mediaUrl: '',
                mediaType: 'none'
              }
            };
          }
          return c;
        });
        saveChatsToCache(updatedChats);
        return updatedChats;
      });
    };

    const handleUserUpdated = (updatedUser) => {
      if (!updatedUser || !updatedUser._id) return;
      const targetUserIdStr = updatedUser._id.toString();

      setRawChats(chatsList => {
        const updatedChats = chatsList.map(c => {
          if (c.type === 'individual' && c.members) {
            const updatedMembers = c.members.map(m => {
              const mId = (m._id || m).toString();
              if (mId === targetUserIdStr) {
                return { ...m, ...updatedUser };
              }
              return m;
            });
            return { ...c, members: updatedMembers };
          }
          if (c.type === 'group' && c.members) {
            const updatedMembers = c.members.map(m => {
              const mId = (m._id || m).toString();
              if (mId === targetUserIdStr) {
                return { ...m, ...updatedUser };
              }
              return m;
            });
            return { ...c, members: updatedMembers };
          }
          return c;
        });
        saveChatsToCache(updatedChats);
        return updatedChats;
      });

      setMessagesMap(prev => {
        const nextMap = { ...prev };
        let updatedAny = false;
        Object.keys(nextMap).forEach(cId => {
          const list = nextMap[cId];
          if (Array.isArray(list)) {
            const updatedList = list.map(m => {
              const senderIdStr = (m.senderId || m.sender?._id || m.sender)?.toString();
              if (senderIdStr === targetUserIdStr && typeof m.sender === 'object') {
                return {
                  ...m,
                  sender: { ...m.sender, ...updatedUser }
                };
              }
              return m;
            });
            nextMap[cId] = updatedList;
            updatedAny = true;
          }
        });
        if (updatedAny) {
          saveMessagesToCache(nextMap);
        }
        return nextMap;
      });
    };

    socket.on('message received', handleMessageReceived);
    socket.on('typing', handleTyping);
    socket.on('stop typing', handleStopTyping);
    socket.on('messages_read', handleMessagesRead);
    socket.on('message_deleted_for_everyone', handleMessageDeletedForEveryone);
    socket.on('user_updated', handleUserUpdated);

    return () => {
      socket.off('message received', handleMessageReceived);
      socket.off('typing', handleTyping);
      socket.off('stop typing', handleStopTyping);
      socket.off('messages_read', handleMessagesRead);
      socket.off('message_deleted_for_everyone', handleMessageDeletedForEveryone);
      socket.off('user_updated', handleUserUpdated);
    };
  }, [socket, activeChatId, user?._id]);

  // Scroll to bottom helper
  const scrollToBottom = useCallback((behavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  }, []);

  // Set chat change scroll flag
  useEffect(() => {
    if (activeChatId) {
      if (lastChatId.current !== activeChatId) {
        lastChatId.current = activeChatId;
        shouldScrollToBottomRef.current = true;
      }
    }
  }, [activeChatId]);

  // Handle messages length change
  useEffect(() => {
    if (!activeChatId) return;

    if (shouldScrollToBottomRef.current) {
      scrollToBottom('auto'); // Instant scroll on chat switch
      shouldScrollToBottomRef.current = false;
      return;
    }

    if (isScrollingToOldMessages.current) {
      // Don't scroll to bottom when we prepended historical messages!
      isScrollingToOldMessages.current = false;
      return;
    }

    // Scroll smoothly for new incoming/outgoing messages
    scrollToBottom('smooth');
  }, [activeChat?.messages?.length, scrollToBottom, activeChatId]);

  const handleScroll = async (e) => {
    const container = e.target;
    // Check if scrolled near the top to load older messages
    if (container.scrollTop === 0 && !loading && !loadingMore && activeChatId) {
      const chatHasMore = hasMoreMap[activeChatId] !== false;
      if (!chatHasMore) return;

      const currentMessages = messagesMap[activeChatId] || [];
      if (currentMessages.length === 0) return;

      const oldestMsg = currentMessages[0];
      const beforeCursor = oldestMsg.createdAt;

      setLoadingMore(true);
      isScrollingToOldMessages.current = true;

      // Capture scroll height before state update
      const preScrollHeight = container.scrollHeight;
      const preScrollTop = container.scrollTop;

      try {
        const data = await fetchMessages(activeChatId, 30, beforeCursor);
        if (data.length < 30) {
          setHasMoreMap(prev => ({ ...prev, [activeChatId]: false }));
        } else {
          setHasMoreMap(prev => ({ ...prev, [activeChatId]: true }));
        }

        const normalizedList = data.map(m => normalizeMessage(m, user?._id)).filter(Boolean);

        setMessagesMap(prev => ({
          ...prev,
          [activeChatId]: [...normalizedList, ...(prev[activeChatId] || [])]
        }));

        // Adjust scroll position to prevent jumping
        setTimeout(() => {
          if (container) {
            container.scrollTop = container.scrollHeight - preScrollHeight + preScrollTop;
          }
        }, 0);
      } catch (err) {
        console.error('Failed to load older messages:', err);
      } finally {
        setLoadingMore(false);
      }
    }
  };

  const handleSelectChat = (chatId) => {
    navigate(`/dashboard?chat=${chatId}`);
  };

  const handleBackToChats = () => {
    navigate('/dashboard');
  };

  // INSTANT OPTIMISTIC MESSAGE SENDING
  const handleSendMessage = async (text, mediaUrl = '', mediaType = 'none') => {
    if (!activeChatId) return;

    // 1. Generate clientMessageId for deduplication
    const clientMessageId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `temp-${Date.now()}`;

    // 2. Create optimistic message payload
    const tempMessage = {
      _id: clientMessageId,
      clientMessageId: clientMessageId,
      chat: activeChatId,
      sender: user, // pass full user object for sender
      senderId: (user?._id || user?.id)?.toString(),
      senderName: user?.name,
      senderAvatar: user?.avatar,
      text: text,
      mediaUrl: mediaUrl,
      mediaType: mediaType,
      status: 'sending',
      createdAt: new Date().toISOString()
    };

    const normalizedTemp = normalizeMessage(tempMessage, user?._id);

    // 3. Immediately update UI state (INSTANT)
    setMessagesMap(prev => {
      const existing = prev[activeChatId] || [];
      const nextMap = {
        ...prev,
        [activeChatId]: mergeMessages(existing, normalizedTemp, user?._id)
      };
      saveMessagesToCache(nextMap);
      return nextMap;
    });

    // 4. Update rawChats last message
    setRawChats(prev => {
      const updated = prev.map(c => c._id === activeChatId ? { ...c, lastMessage: tempMessage } : c);
      saveChatsToCache(updated);
      return updated;
    });

    // 5. Send asynchronously to backend
    try {
      const serverMessage = await sendMessage(activeChatId, text, mediaUrl, mediaType, clientMessageId);
      if (serverMessage && !serverMessage.clientMessageId) {
        serverMessage.clientMessageId = clientMessageId;
      }
      const normalizedServer = normalizeMessage(serverMessage, user?._id);

      // Reconcile optimistic message with server message
      setMessagesMap(prev => {
        const existing = prev[activeChatId] || [];
        const nextMap = {
          ...prev,
          [activeChatId]: mergeMessages(existing, normalizedServer, user?._id)
        };
        saveMessagesToCache(nextMap);
        return nextMap;
      });

      setRawChats(prev => {
        const updated = prev.map(c => c._id === activeChatId ? { ...c, lastMessage: serverMessage } : c);
        saveChatsToCache(updated);
        return updated;
      });

      // Emit socket event for real-time recipients
      if (socket) {
        socket.emit('new message', serverMessage);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Mark optimistic message status as failed on error
      setMessagesMap(prev => {
        const existing = prev[activeChatId] || [];
        const nextMap = {
          ...prev,
          [activeChatId]: existing.map(m => (m.clientMessageId === clientMessageId || m._id === clientMessageId) ? { ...m, status: 'failed' } : m)
        };
        saveMessagesToCache(nextMap);
        return nextMap;
      });
    }
  };

  const handleTypingStart = () => {
    if (socket && activeChatId) {
      socket.emit('typing', { room: activeChatId, senderId: user?._id, user: { name: user?.name } });
    }
  };

  const handleTypingStop = () => {
    if (socket && activeChatId) {
      socket.emit('stop typing', { room: activeChatId, senderId: user?._id, user: { name: user?.name } });
    }
  };

  const handleDeleteChat = async (chatId) => {
    try {
      await axios.delete(`/chats/${chatId}`);
      // Clear messages map for this chat
      setMessagesMap(prev => {
        const nextMap = {
          ...prev,
          [chatId]: []
        };
        saveMessagesToCache(nextMap);
        return nextMap;
      });
      // Clear lastMessage in rawChats
      setRawChats(prev => {
        const updated = prev.map(c => c._id === chatId ? { ...c, lastMessage: null } : c);
        saveChatsToCache(updated);
        return updated;
      });
    } catch (err) {
      console.error('Failed to clear/delete chat history:', err);
    }
  };

  const handleClearChat = async (chatId) => {
    await handleDeleteChat(chatId);
  };

  const handlePinChat = async (chatId) => {
    try {
      await axios.put(`/chats/${chatId}/pin`);
      loadChats();
    } catch (err) {
      console.error('Failed to pin chat:', err);
    }
  };

  const handleArchiveChat = async (chatId) => {
    try {
      await axios.put(`/chats/${chatId}/archive`);
      loadChats();
    } catch (err) {
      console.error('Failed to archive chat:', err);
    }
  };

  const handleBlockUser = async (userId) => {
    try {
      await blockUser(userId);
      if (activeChat && activeChat.otherUserId === userId) {
        navigate('/dashboard');
      }
      loadChats();
    } catch (err) {
      console.error('Failed to block user:', err);
    }
  };

  const handleMuteChat = async (chatId) => {
    try {
      await axios.put(`/chats/${chatId}/mute`);
      loadChats();
    } catch (err) {
      console.error('Failed to mute chat:', err);
    }
  };

  const handleBulkAction = async (chatIds, action) => {
    try {
      await axios.post('/chats/bulk', { chatIds, action });
      loadChats();
    } catch (err) {
      console.error('Failed bulk action:', err);
    }
  };

  const handleCreateGroup = async (name, userIds) => {
    const newGroup = await createGroupChat(name, userIds);
    setRawChats(prev => [newGroup, ...prev]);
    navigate(`/dashboard?chat=${newGroup._id}`);
  };

  const handleDeleteMessage = async (messageId, forEveryone = false) => {
    try {
      await axios.delete(`/messages/${messageId}?forEveryone=${forEveryone}`);
      if (activeChatId) {
        setMessagesMap(prev => {
          const list = prev[activeChatId] || [];
          if (forEveryone) {
            return {
              ...prev,
              [activeChatId]: list.map(m => m.id === messageId ? { ...m, text: 'This message was deleted', isDeletedForEveryone: true } : m)
            };
          } else {
            return {
              ...prev,
              [activeChatId]: list.filter(m => m.id !== messageId)
            };
          }
        });
      }
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      <div className="layout-middle-panel">
        <ChatList
          chats={chats}
          activeChatId={activeChatId}
          onSelectChat={handleSelectChat}
          onDeleteChat={handleDeleteChat}
          onBlockUser={handleBlockUser}
          onMuteChat={handleMuteChat}
          onPinChat={handlePinChat}
          onArchiveChat={handleArchiveChat}
          onClearChat={handleClearChat}
          onBulkAction={handleBulkAction}
          onCreateGroup={handleCreateGroup}
        />
      </div>

      <div className="layout-right-panel">
        {activeChatId ? (
          activeChat ? (
            <div className="active-chat-panel animate-fade">
              <ChatHeader 
                chat={activeChat} 
                onBack={handleBackToChats}
                typingStatus={typingUsers[activeChatId]}
                onOptionsClick={() => {
                  if (activeChat.type === 'group') {
                    setIsGroupInfoOpen(true);
                  }
                }}
              />
              <div className="active-chat-messages" ref={messagesContainerRef} onScroll={handleScroll}>
                {loadingMore && (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
                    <style>{`
                      @keyframes spin-loader {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                      }
                    `}</style>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      border: '2px solid var(--primary)',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin-loader 0.8s linear infinite'
                    }} />
                  </div>
                )}
                {activeChat.messages.map(msg => {
                  const currentUserIdStr = (user?._id || user?.id)?.toString();
                  const senderIdStr = (msg.senderId || msg.sender?._id || msg.sender)?.toString();
                  const isMine = Boolean(senderIdStr && currentUserIdStr && senderIdStr === currentUserIdStr);

                  return (
                    <MessageBubble
                      key={msg.id || msg._id}
                      message={msg}
                      isMe={isMine}
                      showSenderName={activeChat.type === 'group'}
                      onDeleteMessage={handleDeleteMessage}
                    />
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <MessageInput 
                onSendMessage={handleSendMessage}
                onTypingStart={handleTypingStart}
                onTypingStop={handleTypingStop}
              />
              <GroupInfoModal
                isOpen={isGroupInfoOpen}
                onClose={() => setIsGroupInfoOpen(false)}
                chat={activeChat}
                onChatUpdated={handleChatUpdated}
              />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)', gap: '12px' }}>
              <style>{`
                @keyframes spin-loader-lg {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
              <div style={{
                width: '32px',
                height: '32px',
                border: '3px solid var(--border-color)',
                borderTopColor: 'var(--primary)',
                borderRadius: '50%',
                animation: 'spin-loader-lg 1s linear infinite'
              }} />
              <span style={{ fontSize: '13px' }}>Retrieving conversation credentials...</span>
            </div>
          )
        ) : (
          <div className="welcome-placeholder animate-fade">
            <div className="welcome-placeholder-content">
              <div className="welcome-logo-glow">
                <span className="welcome-logo-circle"></span>
              </div>
              <h3>FRANXX</h3>
              <br />
              <p>Welcome to FRANXX! Select a conversation from the left panel or search for squadmates to get started.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
