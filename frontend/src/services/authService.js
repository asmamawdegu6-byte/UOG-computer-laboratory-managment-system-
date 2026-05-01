import api from './api';

// Mock users for testing without backend
const MOCK_USERS = [
  { id: 1, username: 'student', password: 'password', name: 'John Student', role: 'student' },
  { id: 2, username: 'teacher', password: 'password', name: 'Jane Teacher', role: 'teacher' },
  { id: 3, username: 'technician', password: 'password', name: 'Tech Mike', role: 'technician' },
  { id: 4, username: 'admin', password: 'admin123', name: 'Tewodros Campus Admin', role: 'admin', campus: 'Atse Tewodros', campusCode: 'ATW' },
  { id: 5, username: 'asme', password: 'asme123', name: 'Maraki Campus Admin', role: 'admin', campus: 'Maraki', campusCode: 'MAR' },
  { id: 6, username: 'yibe', password: 'yibe123', name: 'Fasil Campus Admin', role: 'admin', campus: 'Atse Fasil', campusCode: 'ATF' },
  { id: 7, username: 'sami', password: 'sami123', name: 'GC Campus Admin', role: 'admin', campus: 'Health Science College (GC)', campusCode: 'HSC' },
  { id: 8, username: 'asmamaw', password: 'asme1234', name: 'Asmamaw - Super Administrator', role: 'superadmin' },
];

const USE_MOCK_AUTH = false; // Set to false when backend is ready

export const authService = {
  login: async (username, password, role = null) => {
    if (USE_MOCK_AUTH) {
      // Mock authentication
      let user = MOCK_USERS.find(u => u.username === username && u.password === password);
      if (user) {
        // If role is specified, verify user has that role
        if (role && user.role !== role) {
          return { success: false, message: `This account does not have the ${role} role` };
        }
        const userWithoutPassword = {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          campus: user.campus || null,
          campusCode: user.campusCode || null
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
      const response = await api.post('/auth/login', { username, password, role });
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

  resetPasswordWithToken: async (token, newPassword) => {
    if (USE_MOCK_AUTH) {
      return { success: true, message: 'Password reset successful!' };
    }
    const response = await api.post('/auth/reset-password', { token, newPassword });
    return response.data;
  },

  findUserForReset: async (username) => {
    if (USE_MOCK_AUTH) {
      return { 
        success: true, 
        phone: '+25191*******', 
        userId: '123' 
      };
    }
    const response = await api.post('/auth/find-user-for-reset', { username });
    return response.data;
  },

  sendResetCode: async (phone) => {
    if (USE_MOCK_AUTH) {
      return { success: true, message: 'Verification code sent to ' + phone };
    }
    const response = await api.post('/auth/send-reset-code', { phone });
    return response.data;
  },

  verifyResetCode: async (phone, code) => {
    if (USE_MOCK_AUTH) {
      return { success: true, message: 'Code verified' };
    }
    const response = await api.post('/auth/verify-reset-code', { phone, code });
    return response.data;
  },

resetPasswordByPhone: async (phone, newPassword) => {
    if (USE_MOCK_AUTH) {
      return { success: true, message: 'Password reset successful!' };
    }
    const response = await api.post('/auth/reset-password-by-phone', { phone, newPassword });
    return response.data;
  },

  // Email verification code methods
  sendEmailCode: async (email) => {
    if (USE_MOCK_AUTH) {
      return { success: true, message: 'Verification code sent to ' + email, code: '123456' };
    }
    const response = await api.post('/auth/send-email-code', { email });
    return response.data;
  },

  verifyEmailCode: async (email, code) => {
    if (USE_MOCK_AUTH) {
      return { success: true, message: 'Code verified' };
    }
    const response = await api.post('/auth/verify-email-code', { email, code });
    return response.data;
  },

  resetPasswordByEmail: async (email, newPassword) => {
    if (USE_MOCK_AUTH) {
      return { success: true, message: 'Password reset successful!' };
    }
    const response = await api.post('/auth/reset-password-by-email', { email, newPassword });
    return response.data;
  },

  getCurrentUser: () => {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('[DEBUG] authService.js: Error parsing user from localStorage:', error);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      return null;
    }
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  }
};