import api from './api';

// Mock users for testing without backend
const MOCK_USERS = [
  { id: 1, username: 'student', password: 'password', name: 'John Student', role: 'student' },
  { id: 2, username: 'teacher', password: 'password', name: 'Jane Teacher', role: 'teacher' },
  { id: 3, username: 'technician', password: 'password', name: 'Tech Mike', role: 'technician' },
  { id: 4, username: 'admin', password: 'password', name: 'Admin Amy', role: 'admin' },
  { id: 5, username: 'superadmin', password: 'password', name: 'Super Admin', role: 'superadmin' },
];

const USE_MOCK_AUTH = false; // Set to false when backend is ready

export const authService = {
  login: async (username, password) => {
    if (USE_MOCK_AUTH) {
      // Mock authentication
      const user = MOCK_USERS.find(u => u.username === username && u.password === password);
      if (user) {
        const userWithoutPassword = {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role
        };
        const mockToken = 'mock-jwt-token-' + Date.now();
        localStorage.setItem('token', mockToken);
        localStorage.setItem('user', JSON.stringify(userWithoutPassword));
        return {
          success: true,
          token: mockToken,
          user: userWithoutPassword
        };
      }
      return { success: false, message: 'Invalid email or password' };
    }

    // Real API call when backend is ready
    try {
      const response = await api.post('/auth/login', { username, password });
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      console.log('[DEBUG] authService.js: Login error:', error.response?.data);
      // Return structured error response with the server's message
      if (error.response) {
        return error.response.data;
      }
      return { success: false, message: error.message || 'Network error' };
    }
  },

  register: async (userData) => {
    if (USE_MOCK_AUTH) {
      // Mock registration
      const existingUser = MOCK_USERS.find(u => u.username === userData.username);
      if (existingUser) {
        return { success: false, message: 'User already exists' };
      }
      return { success: true, message: 'Registration successful! Please login.' };
    }

    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      console.log('[DEBUG] authService.js: Registration error:', error.response?.data);
      // Return structured error response
      if (error.response) {
        return error.response.data;
      }
      return { success: false, message: error.message || 'Network error' };
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  forgotPassword: async (email) => {
    if (USE_MOCK_AUTH) {
      return { success: true, message: 'Password reset instructions sent to your email.' };
    }
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token, newPassword) => {
    if (USE_MOCK_AUTH) {
      return { success: true, message: 'Password reset successful!' };
    }
    const response = await api.post('/auth/reset-password', { token, newPassword });
    return response.data;
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  }
};