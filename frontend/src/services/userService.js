import api from './api';

export const userService = {
  // Create a new user (admin only)
  createUser: async (userData) => {
    const response = await api.post('/users', userData);
    return response.data;
  },

  // Get all users (admin only)
  getUsers: async (params = {}) => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  // Get user by ID
  getUserById: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  // Update user
  updateUser: async (id, userData) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  // Update user role (admin only)
  updateUserRole: async (id, role) => {
    const response = await api.put(`/users/${id}/role`, { role });
    return response.data;
  },

  // Approve a pending user (admin only)
  approveUser: async (id) => {
    const response = await api.put(`/users/${id}/approve`);
    return response.data;
  },

  // Reject a pending user (admin only)
  rejectUser: async (id) => {
    const response = await api.put(`/users/${id}/reject`);
    return response.data;
  },

  // Deactivate user (admin only)
  deleteUser: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  // Reset user password (admin only)
  resetUserPassword: async (id, newPassword) => {
    const response = await api.put(`/users/${id}/reset-password`, { newPassword });
    return response.data;
  },

  // Toggle own account status (activate/deactivate)
  toggleUserStatus: async (id) => {
    const response = await api.put(`/users/${id}/toggle-status`);
    return response.data;
  }
};
