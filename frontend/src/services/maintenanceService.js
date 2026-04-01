import api from './api';

export const maintenanceService = {
  getLabs: async () => {
    const response = await api.get('/labs');
    return response.data;
  },

  reportFault: async (faultData) => {
    const response = await api.post('/maintenance/faults', faultData);
    return response.data;
  },

  getFaults: async (filters) => {
    const response = await api.get('/maintenance/faults', { params: filters });
    return response.data;
  },

  updateFaultStatus: async (faultId, status) => {
    const response = await api.patch(`/maintenance/faults/${faultId}`, { status });
    return response.data;
  },

  getEquipmentStatus: async () => {
    const response = await api.get('/maintenance/equipment');
    return response.data;
  },

  getMaintenanceTickets: async () => {
    const response = await api.get('/maintenance/tickets');
    return response.data;
  },

  updateRepairStatus: async (ticketId, data) => {
    const response = await api.patch(`/maintenance/tickets/${ticketId}`, data);
    return response.data;
  }
};