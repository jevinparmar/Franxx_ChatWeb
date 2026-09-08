/**
 * Normalizes any incoming message object (from REST API, Socket.IO, or Optimistic UI)
 * into a single unified structure for rendering and state management.
 *
 * @param {Object} msg - The raw message object
 * @param {string|Object} currentUserId - Currently logged in user's ID
 * @returns {Object} Normalized message
 */
export const normalizeMessage = (msg, currentUserId) => {
  if (!msg) return null;

  const currentUserIdStr = (typeof currentUserId === 'object' ? currentUserId?._id || currentUserId?.id : currentUserId)?.toString();

  // Extract raw sender and determine ID
  const senderObj = typeof msg.sender === 'object' ? msg.sender : null;
  const senderId = (senderObj?._id || senderObj?.id || msg.senderId || msg.sender)?.toString();

  // Extract receiver ID if present
  const receiverObj = typeof msg.receiver === 'object' ? msg.receiver : null;
  const receiverId = (receiverObj?._id || receiverObj?.id || msg.receiverId || msg.receiver)?.toString();

  // Extract chat ID
  const chatObj = typeof msg.chat === 'object' ? msg.chat : null;
  const chatId = (chatObj?._id || chatObj?.id || msg.chatId || msg.conversationId || msg.chat)?.toString();

  // Determine ownership accurately
  const isMe = Boolean(senderId && currentUserIdStr && senderId === currentUserIdStr);

  const clientMsgId = msg.clientMessageId || msg.tempId || null;
  const dbId = msg._id || msg.id;
  const idStr = (dbId || clientMsgId || `msg-${Date.now()}-${Math.random()}`).toString();

  const createdAt = msg.createdAt ? new Date(msg.createdAt).toISOString() : new Date().toISOString();
  const time = new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return {
    _id: idStr,
    id: idStr,
    clientMessageId: clientMsgId ? clientMsgId.toString() : null,
    chatId: chatId || '',
    senderId: senderId || '',
    receiverId: receiverId || '',
    text: msg.text || '',
    mediaUrl: msg.mediaUrl || '',
    mediaType: msg.mediaType || 'none',
    time: time,
    createdAt: createdAt,
    isMe: isMe,
    senderName: senderObj?.name || msg.senderName || '',
    senderAvatar: senderObj?.avatar || msg.senderAvatar || '',
    senderUsername: senderObj?.username || msg.senderUsername || '',
    isDeletedForEveryone: Boolean(msg.isDeletedForEveryone),
    status: msg.status || 'sent',
    readBy: msg.readBy || [],
    replyTo: msg.replyTo || null,
  };
};

/**
 * Merges a list of existing normalized messages with new message(s).
 * Handles temporary clientMessageId replacements and deduplication by _id/clientMessageId.
 * Preserves chronological order by createdAt.
 *
 * @param {Array} existingMessages 
 * @param {Array|Object} incoming 
 * @param {string} currentUserId 
 * @returns {Array} Updated array of messages
 */
export const mergeMessages = (existingMessages = [], incoming = [], currentUserId = '') => {
  const incomingList = Array.isArray(incoming) ? incoming : [incoming];
  const normalizedIncoming = incomingList.map(m => normalizeMessage(m, currentUserId)).filter(Boolean);

  let updatedList = [...existingMessages];

  normalizedIncoming.forEach(newMsg => {
    // 1. Try matching by clientMessageId if present
    let matchedIndex = -1;
    if (newMsg.clientMessageId) {
      matchedIndex = updatedList.findIndex(m => 
        (m.clientMessageId && m.clientMessageId === newMsg.clientMessageId) || 
        m._id === newMsg.clientMessageId
      );
    }

    // 2. Fallback to matching by _id or clientMessageId matching existing _id
    if (matchedIndex === -1 && newMsg._id) {
      matchedIndex = updatedList.findIndex(m => 
        m._id === newMsg._id || 
        (m.clientMessageId && m.clientMessageId === newMsg._id)
      );
    }

    if (matchedIndex !== -1) {
      // Replace existing optimistic message with real server message (preserving clientMessageId for reference)
      updatedList[matchedIndex] = {
        ...updatedList[matchedIndex],
        ...newMsg,
        clientMessageId: updatedList[matchedIndex].clientMessageId || newMsg.clientMessageId,
        status: newMsg.status || updatedList[matchedIndex].status || 'sent'
      };
    } else {
      // Add as new message
      updatedList.push(newMsg);
    }
  });

  // Sort by createdAt ascending
  return updatedList.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
};
