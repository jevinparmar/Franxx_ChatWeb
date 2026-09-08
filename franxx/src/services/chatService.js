import api from './axios';

export const fetchChats = async () => {
  const { data } = await api.get('/chats');
  return data;
};

export const accessChat = async (userId) => {
  const { data } = await api.post('/chats', { userId });
  return data;
};

export const createGroupChat = async (name, users, avatar) => {
  const { data } = await api.post('/chats/group', { name, users, avatar });
  return data;
};

export const renameGroup = async (chatId, chatName) => {
  const { data } = await api.put('/chats/group/rename', { chatId, chatName });
  return data;
};

export const addToGroup = async (chatId, userId) => {
  const { data } = await api.put('/chats/group/add', { chatId, userId });
  return data;
};

export const removeFromGroup = async (chatId, userId) => {
  const { data } = await api.put('/chats/group/remove', { chatId, userId });
  return data;
};

export const fetchMessages = async (chatId, limit = 50, before = null) => {
  let url = `/messages/${chatId}?limit=${limit}`;
  if (before) {
    url += `&before=${encodeURIComponent(before)}`;
  }
  const { data } = await api.get(url);
  return data;
};

export const sendMessage = async (chatId, text, mediaUrl = '', mediaType = 'none', clientMessageId = null) => {
  const { data } = await api.post('/messages', { chatId, text, mediaUrl, mediaType, clientMessageId });
  return data;
};

export const fetchChatMedia = async (chatId) => {
  const { data } = await api.get(`/chats/${chatId}/media`);
  return data;
};
