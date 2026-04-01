import api from './api';

export const inventoryService = {
  // Get all inventory items
  getAllItems: async (params = {}) => {
    const response = await api.get('/inventory', { params });
    return response.data;
  },

  // Get inventory item by ID
  getItemById: async (id) => {
    const response = await api.get(`/inventory/${id}`);
    return response.data;
  },

  // Create new inventory item
  createItem: async (itemData) => {
    const response = await api.post('/inventory', itemData);
    return response.data;
  },

  // Update inventory item
  updateItem: async (id, itemData) => {
    const response = await api.put(`/inventory/${id}`, itemData);
    return response.data;
  },

  // Add maintenance record
  addMaintenanceRecord: async (id, recordData) => {
    const response = await api.post(`/inventory/${id}/maintenance`, recordData);
    return response.data;
  },

  // Delete inventory item (soft delete)
  deleteItem: async (id) => {
    const response = await api.delete(`/inventory/${id}`);
    return response.data;
  }
};
