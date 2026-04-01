import api from './api';

export const superadminService = {
  // Dashboard
  getDashboard: async () => {
    const response = await api.get('/superadmin/dashboard');
    return response.data;
  },

  // Audit Logs
  getAuditLogs: async (params = {}) => {
    const response = await api.get('/superadmin/audit-logs', { params });
    return response.data;
  },

  getAuditLogActions: async () => {
    const response = await api.get('/superadmin/audit-logs/actions');
    return response.data;
  },

  // Campus Management
  getCampuses: async () => {
    const response = await api.get('/superadmin/campuses');
    return response.data;
  },

  createCampus: async (campusData) => {
    const response = await api.post('/superadmin/campuses', campusData);
    return response.data;
  },

  updateCampus: async (id, campusData) => {
    const response = await api.put(`/superadmin/campuses/${id}`, campusData);
    return response.data;
  },

  deleteCampus: async (id) => {
    const response = await api.delete(`/superadmin/campuses/${id}`);
    return response.data;
  },

  // Role Management
  getRoleDistribution: async () => {
    const response = await api.get('/superadmin/roles');
    return response.data;
  },

  changeUserRole: async (userId, role) => {
    const response = await api.put(`/superadmin/roles/${userId}`, { role });
    return response.data;
  },

  // System Configuration
  getConfigs: async (params = {}) => {
    const response = await api.get('/superadmin/config', { params });
    return response.data;
  },

  updateConfig: async (key, value) => {
    const response = await api.put(`/superadmin/config/${key}`, { value });
    return response.data;
  },

  createConfig: async (configData) => {
    const response = await api.post('/superadmin/config', configData);
    return response.data;
  }
};
