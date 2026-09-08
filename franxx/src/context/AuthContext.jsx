import { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, getProfile } from '../services/authService';
import { updateProfile } from '../services/userService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load session from token on mount
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('franxx-token');
      if (token) {
        try {
          const profile = await getProfile();
          setUser(profile);
        } catch (error) {
          console.error("Session restore failed", error);
          localStorage.removeItem('franxx-token');
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const login = async (emailOrUsername, password) => {
    setLoading(true);
    try {
      const data = await loginUser(emailOrUsername, password);
      localStorage.setItem('franxx-token', data.token);
      setUser(data);
      setLoading(false);
      return data;
    } catch (error) {
      setLoading(false);
      throw error.response?.data?.message ? new Error(error.response.data.message) : error;
    }
  };

  const signup = async (fullName, username, email, password) => {
    setLoading(true);
    try {
      const data = await registerUser(fullName, username, email, password);
      localStorage.setItem('franxx-token', data.token);
      setUser(data);
      setLoading(false);
      return data;
    } catch (error) {
      setLoading(false);
      throw error.response?.data?.message ? new Error(error.response.data.message) : error;
    }
  };

  const logout = () => {
    if (user?._id) {
      localStorage.removeItem(`rawChats_${user._id}`);
      localStorage.removeItem(`messagesMap_${user._id}`);
    }
    localStorage.removeItem('franxx-token');
    setUser(null);
  };

  const updateUser = async (updatedData) => {
    try {
      const updated = await updateProfile(updatedData);
      setUser(updated);
      return updated;
    } catch (error) {
      throw error.response?.data?.message ? new Error(error.response.data.message) : error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
