import api from './axios';

export const loginUser = async (emailOrUsername, password) => {
  const { data } = await api.post('/auth/login', { emailOrUsername, password });
  return data;
};

export const registerUser = async (name, username, email, password) => {
  const { data } = await api.post('/auth/register', { name, username, email, password });
  return data;
};

export const getProfile = async () => {
  const { data } = await api.get('/auth/profile');
  return data;
};

export const forgotPassword = async (email) => {
  const { data } = await api.post('/auth/forgot-password', { email });
  return data;
};

export const resetPassword = async (email, otp, newPassword) => {
  const { data } = await api.post('/auth/reset-password', { email, otp, newPassword });
  return data;
};
