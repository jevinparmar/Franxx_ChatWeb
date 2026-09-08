import api from './axios';

export const getSharedMedia = async () => {
  const { data } = await api.get('/messages/shared/media');
  return data;
};
