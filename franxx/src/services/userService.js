import api from './axios';

export const searchUsers = async (searchQuery) => {
  const { data } = await api.get(`/users?search=${encodeURIComponent(searchQuery)}`);
  return data;
};

export const getUserById = async (id) => {
  const { data } = await api.get(`/users/${id}`);
  return data;
};

export const updateProfile = async (profileData) => {
  const { data } = await api.put('/users/profile', profileData);
  return data;
};

export const toggleFollowUser = async (id) => {
  const { data } = await api.post(`/users/${id}/follow`);
  return data;
};

export const uploadAvatar = async (file) => {
  const formData = new FormData();
  formData.append('avatar', file);
  const { data } = await api.post('/users/upload-avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};

export const getNotifications = async () => {
  const { data } = await api.get('/notifications');
  return data;
};

export const markNotificationsRead = async () => {
  const { data } = await api.patch('/notifications/read-all');
  return data;
};

export const acceptFollowRequest = async (id) => {
  const { data } = await api.post(`/users/requests/${id}/accept`);
  return data;
};

export const declineFollowRequest = async (id) => {
  const { data } = await api.post(`/users/requests/${id}/decline`);
  return data;
};

export const blockUser = async (id) => {
  const { data } = await api.post(`/users/${id}/block`);
  return data;
};

export const unblockUser = async (id) => {
  const { data } = await api.delete(`/users/${id}/block`);
  return data;
};

export const getBlockedUsers = async () => {
  const { data } = await api.get('/users/blocked');
  return data;
};

export const acceptGroupAddRequest = async (notifId) => {
  const { data } = await api.post(`/users/group-requests/${notifId}/accept`);
  return data;
};

export const declineGroupAddRequest = async (notifId) => {
  const { data } = await api.post(`/users/group-requests/${notifId}/decline`);
  return data;
};
