import api from './api';

export const labService = {
  // Get all labs
  getAllLabs: async (params = {}) => {
    const response = await api.get('/labs', { params });
    return response.data;
  },

  // Get lab by ID
  getLabById: async (id) => {
    const response = await api.get(`/labs/${id}`);
    return response.data;
  },

  // Get workstations for a lab
  getWorkstations: async (labId) => {
    const response = await api.get(`/labs/${labId}/workstations`);
    return response.data;
  },

  // Get lab availability for a date
  getAvailability: async (labId, date) => {
    const response = await api.get(`/labs/${labId}/availability`, { params: { date } });
    return response.data;
  },

  // Create new lab
  createLab: async (labData) => {
    const response = await api.post('/labs', labData);
    return response.data;
  },

  // Update lab
  updateLab: async (id, labData) => {
    const response = await api.put(`/labs/${id}`, labData);
    return response.data;
  },

  // Delete lab (soft delete)
  deleteLab: async (id) => {
    const response = await api.delete(`/labs/${id}`);
    return response.data;
  }
};
